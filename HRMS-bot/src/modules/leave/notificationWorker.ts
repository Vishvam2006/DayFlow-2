import type { WASocket } from '@whiskeysockets/baileys';
import {
  acknowledgeLeaveNotification,
  claimPendingLeaveNotifications,
  reportLeaveNotificationFailure,
  type PendingLeaveNotification,
} from '../hrms/leaveNotifications.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

const POLL_INTERVAL_MS = config.LEAVE_NOTIFICATION_POLL_INTERVAL_MS;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function formatLeaveStatusMessage(notification: PendingLeaveNotification): string {
  const dateRange = `${formatDate(notification.fromDate)} - ${formatDate(notification.toDate)}`;
  const baseLine = `Your leave request (${notification.leaveType} Leave: ${dateRange}) has been ${notification.status}.`;

  if (notification.status === 'Rejected' && notification.decisionComment?.trim()) {
    return `${baseLine}\nReason: ${notification.decisionComment.trim()}`;
  }

  return baseLine;
}

async function resolveRecipientJid(sock: Pick<WASocket, 'onWhatsApp'>, phoneNumber?: string) {
  if (!phoneNumber) {
    throw new Error('The employee does not have a registered phone number.');
  }

  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  if (!normalizedPhone) {
    throw new Error('The employee phone number is invalid.');
  }

  const lookup = await sock.onWhatsApp(normalizedPhone);
  const recipient = lookup?.find((entry) => entry.exists && typeof entry.jid === 'string');

  if (!recipient?.jid) {
    throw new Error('The employee phone number is not reachable on WhatsApp.');
  }

  return recipient.jid;
}

type WorkerDependencies = {
  claim?: typeof claimPendingLeaveNotifications;
  acknowledge?: typeof acknowledgeLeaveNotification;
  reportFailure?: typeof reportLeaveNotificationFailure;
  pollIntervalMs?: number;
};

export function createLeaveNotificationWorker(
  sock: Pick<WASocket, 'sendMessage' | 'onWhatsApp'>,
  dependencies: WorkerDependencies = {},
) {
  const claim = dependencies.claim ?? claimPendingLeaveNotifications;
  const acknowledge = dependencies.acknowledge ?? acknowledgeLeaveNotification;
  const reportFailure = dependencies.reportFailure ?? reportLeaveNotificationFailure;
  const pollIntervalMs = dependencies.pollIntervalMs ?? POLL_INTERVAL_MS;

  let timer: NodeJS.Timeout | null = null;
  let inFlight = false;

  const pollOnce = async () => {
    if (inFlight) return;
    inFlight = true;

    try {
      const result = await claim(10);

      if (!result.success) {
        logger.error({ error: result.error }, 'Failed to claim leave notifications');
        return;
      }

      for (const notification of result.notifications) {
        try {
          const recipientJid = await resolveRecipientJid(sock, notification.employee?.phoneNumber);
          const message = formatLeaveStatusMessage(notification);

          await sock.sendMessage(recipientJid, { text: message });
          logger.info(
            {
              leaveId: notification.leaveId,
              employeeId: notification.employee?.employeeId,
              status: notification.status,
            },
            'Leave notification delivered on WhatsApp',
          );

          const ack = await acknowledge(notification.leaveId, notification.status);
          if (!ack.success) {
            logger.error(
              { leaveId: notification.leaveId, error: ack.error },
              'Leave notification delivered but acknowledgement failed',
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Leave notification delivery failed.';

          logger.error(
            {
              leaveId: notification.leaveId,
              employeeId: notification.employee?.employeeId,
              error: errorMessage,
            },
            'Failed to deliver leave notification',
          );

          await reportFailure(notification.leaveId, notification.status, errorMessage);
        }
      }
    } finally {
      inFlight = false;
    }
  };

  const start = () => {
    if (timer) return timer;

    logger.info({ pollIntervalMs }, 'Starting leave notification worker');
    void pollOnce();
    timer = setInterval(() => {
      void pollOnce();
    }, pollIntervalMs);

    if (typeof timer.unref === 'function') {
      timer.unref();
    }

    return timer;
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return {
    pollOnce,
    start,
    stop,
  };
}
