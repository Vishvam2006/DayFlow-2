import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectAttendanceIntent } from '../modules/attendance/intents.js';

test('maps natural language check-in and check-out phrases to attendance intents', () => {
  assert.deepEqual(detectAttendanceIntent('I reached office').intent, 'CHECK_IN');
  assert.deepEqual(detectAttendanceIntent('done for today').intent, 'CHECK_OUT');
});

test('detects attendance status and monthly summary requests with month extraction', () => {
  const statusIntent = detectAttendanceIntent('what is my attendance status today');
  assert.equal(statusIntent.intent, 'TODAY_STATUS');

  const summaryIntent = detectAttendanceIntent('show my attendance summary for March 2026');
  assert.equal(summaryIntent.intent, 'MONTHLY_SUMMARY');
  assert.equal(summaryIntent.month, '2026-03');
});

test('falls back to unknown for unrelated or ambiguous messages', () => {
  assert.equal(detectAttendanceIntent('hello there').intent, 'UNKNOWN');
  assert.equal(detectAttendanceIntent('can you help me').intent, 'UNKNOWN');
});
