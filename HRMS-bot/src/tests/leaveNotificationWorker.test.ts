import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLeaveNotificationWorker,
  formatLeaveStatusMessage,
} from '../modules/leave/notificationWorker.js';
import type { PendingLeaveNotification } from '../modules/hrms/leaveNotifications.js';

const sampleNotification: PendingLeaveNotification = {
  leaveId: '507f191e810c19729de860ea',
  status: 'Rejected',
  leaveType: 'Sick',
  fromDate: '2026-05-12T00:00:00.000Z',
  toDate: '2026-05-14T00:00:00.000Z',
  reason: 'Medical rest',
  decisionComment: 'Insufficient leave balance.',
  employee: {
    id: '507f1f77bcf86cd799439011',
    name: 'Priya Sharma',
    empId: 'EMP-2026-1001',
    employeeId: 'EMP-2026-1001',
    phoneNumber: '+919811111111',
    department: 'Engineering',
  },
};

test('formats professional leave status messages with optional rejection reason', () => {
  const message = formatLeaveStatusMessage(sampleNotification);

  assert.match(message, /Your leave request \(Sick Leave:/);
  assert.match(message, /has been Rejected\./);
  assert.match(message, /Reason: Insufficient leave balance\./);
});

test('worker sends leave notifications and acknowledges successful delivery', async () => {
  const sent: Array<{ jid: string; text: string }> = [];
  const acknowledged: Array<{ leaveId: string; status: string }> = [];

  const worker = createLeaveNotificationWorker(
    {
      onWhatsApp: async () => [{ exists: true, jid: '919811111111@s.whatsapp.net' }],
      sendMessage: async (jid, payload) => {
        sent.push({ jid, text: payload.text });
      },
    } as any,
    {
      claim: async () => ({
        success: true,
        notifications: [sampleNotification],
      }),
      acknowledge: async (leaveId, status) => {
        acknowledged.push({ leaveId, status });
        return { success: true };
      },
      reportFailure: async () => ({ success: true }),
      pollIntervalMs: 999999,
    },
  );

  await worker.pollOnce();

  assert.equal(sent.length, 1);
  assert.equal(sent[0].jid, '919811111111@s.whatsapp.net');
  assert.match(sent[0].text, /Your leave request/);
  assert.deepEqual(acknowledged, [
    { leaveId: sampleNotification.leaveId, status: sampleNotification.status },
  ]);
});

test('worker records failures when the employee phone number is missing or unreachable', async () => {
  const failures: Array<{ leaveId: string; status: string; error: string }> = [];

  const worker = createLeaveNotificationWorker(
    {
      onWhatsApp: async () => [],
      sendMessage: async () => {
        throw new Error('sendMessage should not be called');
      },
    } as any,
    {
      claim: async () => ({
        success: true,
        notifications: [
          {
            ...sampleNotification,
            employee: {
              ...sampleNotification.employee!,
              phoneNumber: '',
            },
          },
        ],
      }),
      acknowledge: async () => ({ success: true }),
      reportFailure: async (leaveId, status, error) => {
        failures.push({ leaveId, status, error });
        return { success: true };
      },
      pollIntervalMs: 999999,
    },
  );

  await worker.pollOnce();

  assert.equal(failures.length, 1);
  assert.equal(failures[0].leaveId, sampleNotification.leaveId);
  assert.match(failures[0].error, /registered phone number|phone number/i);
});
