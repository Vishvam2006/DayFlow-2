import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../../../server/app.js';
import { connectDB, disconnectDB, clearDB } from '../../../server/tests/setup.js';
import User from '../../../server/models/User.js';
import Attendance from '../../../server/models/Attendance.js';
import { hrmsApi } from '../modules/hrms/client.js';
import { handleAttendanceIntent } from '../modules/attendance/handler.js';
import type { VerifiedEmployee } from '../modules/hrms/employeeVerifier.js';

const BOT_SECRET = 'test-bot-secret';

let server: http.Server;
let baseURL = '';

before(async () => {
  process.env.BOT_SECRET_KEY = BOT_SECRET;
  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine test server address.');
  }

  baseURL = `http://127.0.0.1:${address.port}`;
  hrmsApi.defaults.baseURL = baseURL;
  hrmsApi.defaults.headers['x-bot-secret-key'] = BOT_SECRET;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await disconnectDB();
});

beforeEach(async () => {
  await clearDB();
});

test('handles full attendance flow from bot handler to backend and database', async () => {
  const employeeDoc = await User.create({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phoneNumber: '+919811111111',
    password: 'password123',
    role: 'employee',
    employeeId: 'EMP-2026-1001',
    department: 'Engineering',
    jobTitle: 'Developer',
  });

  const employee: VerifiedEmployee = {
    id: String(employeeDoc._id),
    empId: employeeDoc.employeeId,
    employeeId: employeeDoc.employeeId,
    role: employeeDoc.role,
    name: employeeDoc.name,
    email: employeeDoc.email,
    phoneNumber: employeeDoc.phoneNumber,
    department: employeeDoc.department,
    jobTitle: employeeDoc.jobTitle,
  };

  const checkInReply = await handleAttendanceIntent('I reached office', employee);
  assert.match(checkInReply ?? '', /Checked in successfully|Attendance marked/i);

  const openAttendance = await Attendance.findOne({ employee: employeeDoc._id });
  assert.ok(openAttendance);
  assert.equal(Boolean(openAttendance.checkIn), true);

  const statusReply = await handleAttendanceIntent('attendance status', employee);
  assert.match(statusReply ?? '', /currently checked in/i);

  const checkOutReply = await handleAttendanceIntent('done for today', employee);
  assert.match(checkOutReply ?? '', /Checked out successfully/i);

  const summaryReply = await handleAttendanceIntent('monthly attendance summary', employee);
  assert.match(summaryReply ?? '', /Attendance summary for/i);
  assert.match(summaryReply ?? '', /Present|Half days|Absent/i);
});

test('returns a clear message for unregistered or invalid employee attendance access', async () => {
  const employee: VerifiedEmployee = {
    id: '507f191e810c19729de860ea',
    empId: 'EMP-UNKNOWN',
    employeeId: 'EMP-UNKNOWN',
    role: 'employee',
    name: 'Unknown User',
    email: 'unknown@example.com',
    phoneNumber: '+919800000000',
  };

  const reply = await handleAttendanceIntent('attendance status', employee);
  assert.match(reply ?? '', /Employee not found/i);
});
