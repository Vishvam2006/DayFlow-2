import {
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import path from 'path';
import { logger } from '../../utils/logger.js';
import {
  normalizeWhatsAppJidToPhoneNumber,
  verifyEmployeeByPhoneNumber,
  type VerifiedEmployee,
} from '../hrms/employeeVerifier.js';
import { handleLeaveRequestFlow } from '../leave/stateMachine.js';
import { handleTaskCommand } from '../tasks/commands.js';
import { hrmsApi } from '../hrms/client.js';

const AUTH_DIR = path.join(process.cwd(), '.baileys-auth');

/**
 * Maps WhatsApp @lid JIDs → @s.whatsapp.net JIDs.
 * WhatsApp multi-device sends sender JIDs as internal LID numbers instead of
 * phone numbers. We build this map using sock.onWhatsApp() after connection.
 */
const lidToPhoneJid = new Map<string, string>();

function resolveJid(senderJid: string): string {
  if (!senderJid.endsWith('@lid')) return senderJid;
  return lidToPhoneJid.get(senderJid) ?? senderJid;
}

export async function createWhatsAppClient(
  onMessage: (jid: string, text: string, employee: VerifiedEmployee) => Promise<string>,
) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: logger.child({ module: 'baileys' }) as any,
    getMessage: async () => undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  /**
   * After connection opens, fetch all employee phone numbers from the HRMS API
   * and use sock.onWhatsApp() to resolve their LID ↔ phone JID mapping.
   */
  const buildLidMap = async () => {
    try {
      // Fetch all employees from HRMS to get their phone numbers
      const res = await hrmsApi.get<{ employees?: { phoneNumber: string }[] }>(
        '/api/bot/employees',
        { validateStatus: (s) => s >= 200 && s < 300 },
      );

      const phoneNumbers = (res.data.employees ?? [])
        .map((e) => e.phoneNumber.replace('+', ''))
        .filter(Boolean);

      if (!phoneNumbers.length) {
        logger.warn('No employee phone numbers fetched from HRMS, LID map will be empty');
        return;
      }

      const results = await sock.onWhatsApp(...phoneNumbers);

      if (results) {
        for (const r of results) {
          if (r.exists && r.lid && r.jid) {
            const lidJid = r.lid.endsWith('@lid') ? r.lid : `${r.lid}@lid`;
            lidToPhoneJid.set(lidJid, r.jid);
            logger.info({ lidJid, phoneJid: r.jid }, 'LID → phone mapping established');
          }
        }
      }

      logger.info({ mappedCount: lidToPhoneJid.size }, 'LID map build complete');
    } catch (err) {
      logger.error({ err }, 'Failed to build LID→phone map (will retry on next message if needed)');
    }
  };

  /**
   * Fallback: resolve a single @lid JID by scanning all employees via onWhatsApp.
   * This is called when a message arrives from an unmapped LID.
   */
  const resolveLidFallback = async (lidJid: string): Promise<string | null> => {
    try {
      // Re‑run buildLidMap to catch any new employees
      await buildLidMap();
      const resolved = lidToPhoneJid.get(lidJid);
      return resolved ?? null;
    } catch {
      return null;
    }
  };

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info({ shouldReconnect }, 'Connection closed');
      if (shouldReconnect) createWhatsAppClient(onMessage);
    } else if (connection === 'open') {
      logger.info('WhatsApp connected ✓');
      // Build the LID→phone map once connected
      buildLidMap().catch((err) =>
        logger.error({ err }, 'Error during initial LID map build'),
      );
    }

    if (qr) {
      qrcode.generate(qr, { small: true });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      const jid = msg.key.remoteJid;

      try {
        if (msg.key.fromMe || !msg.message || !jid) continue;

        const rawSenderJid = msg.key.participant ?? jid;

        // Resolve @lid JIDs to their real @s.whatsapp.net counterpart
        let senderJid = resolveJid(rawSenderJid);

        // If still unresolved, try the fallback (re-fetches employee list)
        if (senderJid.endsWith('@lid')) {
          logger.info({ rawSenderJid }, 'LID not in cache, attempting fallback resolution');
          const resolved = await resolveLidFallback(senderJid);
          if (resolved) {
            senderJid = resolved;
          } else {
            logger.warn(
              { jid, rawSenderJid },
              'Could not resolve @lid JID to a phone number — sender may not be a registered employee',
            );
            await sock.sendMessage(jid, {
              text: 'This WhatsApp number is not linked to an active employee profile. Please contact HR to update your phone number.',
            });
            continue;
          }
        }

        const senderPhoneNumber = normalizeWhatsAppJidToPhoneNumber(senderJid);

        if (!senderPhoneNumber) {
          logger.warn({ jid, senderJid }, 'Unable to normalize WhatsApp sender JID');
          continue;
        }

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          '';
        if (!text.trim()) continue;

        let employee: VerifiedEmployee | null = null;

        try {
          employee = await verifyEmployeeByPhoneNumber(senderPhoneNumber);
        } catch (err) {
          logger.error({ err, jid, senderJid, senderPhoneNumber }, 'Employee verification failed');
          await sock.sendMessage(jid, {
            text: 'I could not verify your employee profile right now. Please try again in a moment.',
          });
          continue;
        }

        if (!employee) {
          logger.warn({ jid, senderJid, senderPhoneNumber }, 'Unverified WhatsApp sender blocked');
          await sock.sendMessage(jid, {
            text: 'This WhatsApp number is not linked to an active employee profile. Please contact HR to update your phone number.',
          });
          continue;
        }

        const leaveFlowReply = await handleLeaveRequestFlow(text, employee);

        if (leaveFlowReply) {
          await sock.sendMessage(jid, { text: leaveFlowReply });
          continue;
        }

        const taskCommandReply = await handleTaskCommand(text, employee);

        if (taskCommandReply) {
          await sock.sendMessage(jid, { text: taskCommandReply });
          continue;
        }

        await sock.sendPresenceUpdate('composing', jid);

        const reply = await onMessage(jid, text, employee);

        await sock.sendMessage(jid, { text: reply });
        await sock.sendPresenceUpdate('paused', jid);
      } catch (err) {
        logger.error({ err, jid }, 'Unhandled WhatsApp message processing error');
        if (jid) {
          await sock.sendMessage(jid, {
            text: 'Sorry, I hit a temporary issue while processing that. Please try again in a moment.',
          });
        }
      }
    }
  });

  return sock;
}
