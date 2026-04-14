import type { VerifiedEmployee } from '../hrms/employeeVerifier.js';
import {
  checkInAttendance,
  checkOutAttendance,
  fetchMonthlyAttendanceSummary,
  fetchTodayAttendance,
  type HrmsAttendanceRecord,
} from '../hrms/attendance.js';
import { detectAttendanceIntent } from './intents.js';

const formatTime = (value?: string) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatAttendanceSnapshot = (attendance: HrmsAttendanceRecord | null) => {
  if (!attendance) {
    return 'You do not have an attendance record for today yet.';
  }

  if (attendance.checkIn && !attendance.checkOut) {
    return [
      'You are currently checked in.',
      `Check-in: ${formatTime(attendance.checkIn)}`,
      `Arrival: ${attendance.arrivalStatus ?? 'Unknown'}`,
      attendance.isFlagged
        ? 'Network verification: Flagged for HR review.'
        : 'Network verification: Verified.',
    ].join('\n');
  }

  return [
    `Today: ${attendance.status}`,
    `Check-in: ${formatTime(attendance.checkIn)}`,
    `Check-out: ${formatTime(attendance.checkOut)}`,
    `Work hours: ${(attendance.workHours ?? 0).toFixed(2)}`,
    `Arrival: ${attendance.arrivalStatus ?? 'Unknown'}`,
    attendance.isFlagged
      ? 'Network verification: Flagged for HR review.'
      : 'Network verification: Verified.',
  ].join('\n');
};

export async function handleAttendanceIntent(
  text: string,
  employee: VerifiedEmployee,
): Promise<string | null> {
  const intent = detectAttendanceIntent(text);

  if (intent.intent === 'UNKNOWN') {
    return null;
  }

  if (intent.intent === 'CHECK_IN') {
    const statusResult = await fetchTodayAttendance(employee.employeeId);

    if (!statusResult.success) {
      return `I could not check your attendance status: ${statusResult.error ?? 'Please try again later.'}`;
    }

    if (statusResult.attendance?.checkIn && !statusResult.attendance?.checkOut) {
      return [
        'You are already checked in for today.',
        `Check-in: ${formatTime(statusResult.attendance.checkIn)}`,
        'Reply with something like "done for today" when you want to check out.',
      ].join('\n');
    }

    if (statusResult.attendance?.checkOut) {
      return [
        'Attendance is already closed for today.',
        formatAttendanceSnapshot(statusResult.attendance),
      ].join('\n\n');
    }

    const result = await checkInAttendance(employee.employeeId);

    if (!result.success) {
      return `I could not check you in: ${result.error ?? 'Please try again later.'}`;
    }

    return [
      result.message ?? 'Checked in successfully.',
      formatAttendanceSnapshot(result.attendance ?? null),
    ].join('\n\n');
  }

  if (intent.intent === 'CHECK_OUT') {
    const statusResult = await fetchTodayAttendance(employee.employeeId);

    if (!statusResult.success) {
      return `I could not check your attendance status: ${statusResult.error ?? 'Please try again later.'}`;
    }

    if (!statusResult.attendance?.checkIn) {
      return 'You have not checked in today yet, so I cannot check you out.';
    }

    if (statusResult.attendance?.checkOut) {
      return [
        'You have already checked out for today.',
        formatAttendanceSnapshot(statusResult.attendance),
      ].join('\n\n');
    }

    const result = await checkOutAttendance(employee.employeeId);

    if (!result.success) {
      return `I could not check you out: ${result.error ?? 'Please try again later.'}`;
    }

    return [
      result.message ?? 'Checked out successfully.',
      formatAttendanceSnapshot(result.attendance ?? null),
    ].join('\n\n');
  }

  if (intent.intent === 'TODAY_STATUS') {
    const result = await fetchTodayAttendance(employee.employeeId);

    if (!result.success) {
      return `I could not fetch your attendance status: ${result.error ?? 'Please try again later.'}`;
    }

    return formatAttendanceSnapshot(result.attendance ?? null);
  }

  if (intent.intent === 'MONTHLY_SUMMARY') {
    const result = await fetchMonthlyAttendanceSummary(employee.employeeId, intent.month);

    if (!result.success) {
      return `I could not fetch your monthly attendance summary: ${result.error ?? 'Please try again later.'}`;
    }

    const summary = result.summary;

    return [
      `Attendance summary for ${summary.month}:`,
      `Present: ${summary.presentDays}`,
      `Half days: ${summary.halfDays}`,
      `Absent: ${summary.absentDays}`,
      `Late arrivals: ${summary.lateDays}`,
      `Incomplete days: ${summary.incompleteDays}`,
      `Flagged days: ${summary.flaggedDays}`,
      `Total work hours: ${summary.totalWorkHours.toFixed(2)}`,
    ].join('\n');
  }

  return null;
}
