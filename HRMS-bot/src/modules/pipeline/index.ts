import { getOrCreateSession, updateSession } from '../conversation/session.js';
import { detectLanguage } from '../conversation/language.js';
import { retrieve } from '../rag/retriever.js';
import { chat } from '../llm/client.js';
import { buildSystemPrompt, buildUserMessage } from '../llm/prompts.js';
import { config } from '../../config/index.js';
import {
  normalizeWhatsAppJidToPhoneNumber,
  verifyEmployeeByPhoneNumber,
  type VerifiedEmployee,
} from '../hrms/employeeVerifier.js';
import { handleLeaveRequestFlow } from '../leave/stateMachine.js';
import { handleAttendanceIntent } from '../attendance/handler.js';

export async function runPipeline(
  jid: string,
  userMessage: string,
  verifiedEmployee?: VerifiedEmployee | null,
): Promise<string> {
  // 0. Verify Employee and check for exact bot workflows
  const phoneNumber = normalizeWhatsAppJidToPhoneNumber(jid);
  let employee = verifiedEmployee ?? null;

  if (!employee && phoneNumber) {
    employee = await verifyEmployeeByPhoneNumber(phoneNumber);
  }

  if (employee) {
    const leaveReply = await handleLeaveRequestFlow(userMessage, employee);
    if (leaveReply) {
      const session = await getOrCreateSession(jid, userMessage);
      session.history.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: leaveReply }
      );
      await updateSession(session);
      return leaveReply;
    }

    const attendanceReply = await handleAttendanceIntent(userMessage, employee);
    if (attendanceReply) {
      const session = await getOrCreateSession(jid, userMessage);
      session.history.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: attendanceReply }
      );
      await updateSession(session);
      return attendanceReply;
    }
  }

  // 1. Get / create session
  const session = await getOrCreateSession(jid, userMessage);

  // 2. Force language to English
  session.language = 'en';

  // 3. Retrieve relevant KB chunks
  const chunks = await retrieve(userMessage);
  const chunkTexts = chunks.map(c => c.content);

  // 4. Build message array (system + trimmed history + new user msg)
  const systemPrompt = buildSystemPrompt(session.language, config.SHOP_NAME, employee);
  const userContent = buildUserMessage(userMessage, chunkTexts);

  const recentHistory = session.history.slice(-(config.MAX_HISTORY_TURNS * 2))
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...recentHistory,
    { role: 'user' as const, content: userContent },
  ];

  // 5. Call LLM
  const reply = await chat(messages);

  // 6. Persist updated history
  session.history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: reply }
  );
  await updateSession(session);

  return reply;
}
