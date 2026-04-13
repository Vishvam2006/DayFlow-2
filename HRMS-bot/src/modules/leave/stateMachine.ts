import { applyLeave } from '../hrms/leaves.js';
import type { VerifiedEmployee } from '../hrms/employeeVerifier.js';

type LeaveStep =
  | 'AWAITING_LEAVE_DATES'
  | 'AWAITING_LEAVE_END_DATE'
  | 'AWAITING_LEAVE_REASON'
  | 'AWAITING_LEAVE_CONFIRMATION';

type LeaveState = {
  step: LeaveStep;
  employeeId: string;
  fromDate?: string;
  toDate?: string;
  reason?: string;
  updatedAt: number;
};

const leaveStates = new Map<string, LeaveState>();
const LEAVE_TRIGGER_PATTERN = /^\s*apply\s+for\s+leave\s*$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const STATE_TTL_MS = 30 * 60 * 1000;

const getStateKey = (employee: VerifiedEmployee) => employee.employeeId || employee.id;

const isCancel = (text: string) => /^\s*(cancel|stop|no)\s*$/i.test(text);

const isValidIsoDate = (value: string) => {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isBefore = (left: string, right: string) =>
  new Date(`${left}T00:00:00.000Z`) < new Date(`${right}T00:00:00.000Z`);

const getActiveState = (stateKey: string) => {
  const state = leaveStates.get(stateKey);

  if (!state) return null;

  if (Date.now() - state.updatedAt > STATE_TTL_MS) {
    leaveStates.delete(stateKey);
    return null;
  }

  return state;
};

const saveState = (stateKey: string, state: LeaveState) => {
  leaveStates.set(stateKey, { ...state, updatedAt: Date.now() });
};

export async function handleLeaveRequestFlow(
  text: string,
  employee: VerifiedEmployee,
): Promise<string | null> {
  const trimmedText = text.trim();
  const stateKey = getStateKey(employee);
  const existingState = getActiveState(stateKey);

  if (!existingState && !LEAVE_TRIGGER_PATTERN.test(trimmedText)) {
    return null;
  }

  if (!existingState) {
    saveState(stateKey, {
      step: 'AWAITING_LEAVE_DATES',
      employeeId: employee.employeeId,
      updatedAt: Date.now(),
    });

    return 'Sure. Please enter the start date for your leave in YYYY-MM-DD format.';
  }

  if (isCancel(trimmedText) && existingState.step !== 'AWAITING_LEAVE_CONFIRMATION') {
    leaveStates.delete(stateKey);
    return 'Leave request cancelled.';
  }

  if (existingState.step === 'AWAITING_LEAVE_DATES') {
    if (!isValidIsoDate(trimmedText)) {
      return 'Please enter a valid start date in YYYY-MM-DD format.';
    }

    saveState(stateKey, {
      ...existingState,
      step: 'AWAITING_LEAVE_END_DATE',
      fromDate: trimmedText,
    });

    return 'Got it. Please enter the end date in YYYY-MM-DD format.';
  }

  if (existingState.step === 'AWAITING_LEAVE_END_DATE') {
    if (!isValidIsoDate(trimmedText)) {
      return 'Please enter a valid end date in YYYY-MM-DD format.';
    }

    if (existingState.fromDate && isBefore(trimmedText, existingState.fromDate)) {
      return 'End date cannot be before the start date. Please enter the end date again.';
    }

    saveState(stateKey, {
      ...existingState,
      step: 'AWAITING_LEAVE_REASON',
      toDate: trimmedText,
    });

    return 'Thanks. What is the reason for your leave?';
  }

  if (existingState.step === 'AWAITING_LEAVE_REASON') {
    if (trimmedText.length < 3) {
      return 'Please enter a short reason for your leave.';
    }

    const nextState = {
      ...existingState,
      step: 'AWAITING_LEAVE_CONFIRMATION' as const,
      reason: trimmedText,
    };
    saveState(stateKey, nextState);

    return `Please confirm your leave: ${nextState.fromDate} to ${nextState.toDate} for ${nextState.reason}. Reply YES to confirm or NO to cancel.`;
  }

  if (existingState.step === 'AWAITING_LEAVE_CONFIRMATION') {
    if (/^\s*no\s*$/i.test(trimmedText)) {
      leaveStates.delete(stateKey);
      return 'Leave request cancelled.';
    }

    if (!/^\s*yes\s*$/i.test(trimmedText)) {
      return 'Please reply YES to confirm or NO to cancel.';
    }

    const result = await applyLeave({
      employeeId: existingState.employeeId,
      fromDate: existingState.fromDate!,
      toDate: existingState.toDate!,
      reason: existingState.reason!,
      leaveType: 'Casual',
    });

    leaveStates.delete(stateKey);

    if (!result.success) {
      return `I could not apply your leave: ${result.error ?? 'Please try again later.'}`;
    }

    return 'Your leave request has been submitted and is now pending approval.';
  }

  return null;
}
