import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLeaveRequestFlow } from '../modules/leave/stateMachine.js';
import type { VerifiedEmployee } from '../modules/hrms/employeeVerifier.js';

const employee: VerifiedEmployee = {
  id: '507f191e810c19729de860ea',
  empId: 'EMP-2026-1001',
  employeeId: 'EMP-2026-1001',
  role: 'employee',
  name: 'Priya Sharma',
  email: 'priya@example.com',
  phoneNumber: '+919811111111',
  department: 'Engineering',
  jobTitle: 'Developer',
};

test('guided leave flow collects details and submits the mapped employee ID', async () => {
  let capturedPayload: any = null;

  const handleLeaveRequestFlow = createLeaveRequestFlow({
    now: () => new Date('2026-04-14T09:00:00.000Z'),
    submitLeave: async (payload) => {
      capturedPayload = payload;
      return { success: true, message: 'created' };
    },
  });

  assert.match(
    (await handleLeaveRequestFlow('apply for leave', employee)) ?? '',
    /Reply with the leave type/i,
  );
  assert.match(
    (await handleLeaveRequestFlow('2', employee)) ?? '',
    /start date/i,
  );
  assert.match(
    (await handleLeaveRequestFlow('2026-04-13', employee)) ?? '',
    /cannot be in the past/i,
  );
  assert.match(
    (await handleLeaveRequestFlow('2026-04-18', employee)) ?? '',
    /end date/i,
  );
  assert.match(
    (await handleLeaveRequestFlow('2026-04-17', employee)) ?? '',
    /cannot be before the start date/i,
  );
  assert.match(
    (await handleLeaveRequestFlow('2026-04-20', employee)) ?? '',
    /share a short reason/i,
  );
  assert.match(
    (await handleLeaveRequestFlow('ok', employee)) ?? '',
    /at least 3 characters/i,
  );

  const confirmation = await handleLeaveRequestFlow('Recovering from fever', employee);
  assert.match(confirmation ?? '', /Employee ID: EMP-2026-1001/);
  assert.match(confirmation ?? '', /Leave type: Sick/);

  const finalReply = await handleLeaveRequestFlow('yes', employee);
  assert.equal(
    finalReply,
    'Your leave request has been submitted and is now pending approval in HRMS.',
  );
  assert.deepEqual(capturedPayload, {
    empId: 'EMP-2026-1001',
    employeeId: 'EMP-2026-1001',
    fromDate: '2026-04-18',
    toDate: '2026-04-20',
    reason: 'Recovering from fever',
    leaveType: 'Sick',
  });
});

test('leave flow supports cancellation and surfaces submission failures cleanly', async () => {
  const handleLeaveRequestFlow = createLeaveRequestFlow({
    now: () => new Date('2026-04-14T09:00:00.000Z'),
    submitLeave: async () => ({
      success: false,
      error: 'HRMS is temporarily unavailable.',
    }),
  });

  assert.equal(await handleLeaveRequestFlow('apply leave', employee), [
    "Sure. Let's create your leave request.",
    'Reply with the leave type:',
    '1. Casual',
    '2. Sick',
    '3. Paid',
    '4. Unpaid',
    'You can reply with the number or the name. Reply CANCEL anytime to stop.',
  ].join('\n'));
  assert.equal(await handleLeaveRequestFlow('cancel', employee), 'Leave request cancelled.');

  await handleLeaveRequestFlow('apply for leave', employee);
  await handleLeaveRequestFlow('Casual', employee);
  await handleLeaveRequestFlow('2026-04-18', employee);
  await handleLeaveRequestFlow('2026-04-18', employee);
  await handleLeaveRequestFlow('Personal work', employee);

  assert.equal(
    await handleLeaveRequestFlow('confirm', employee),
    'I could not apply your leave: HRMS is temporarily unavailable.',
  );
});
