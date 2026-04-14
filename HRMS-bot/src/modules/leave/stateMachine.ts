import { applyLeave, type ApplyLeavePayload } from '../hrms/leaves.js';
import type { VerifiedEmployee } from '../hrms/employeeVerifier.js';

type LeaveType = NonNullable<ApplyLeavePayload['leaveType']>;

type LeaveStep =
  | 'AWAITING_LEAVE_TYPE'
  | 'AWAITING_LEAVE_START_DATE'
  | 'AWAITING_LEAVE_END_DATE'
  | 'AWAITING_LEAVE_REASON'
  | 'AWAITING_LEAVE_CONFIRMATION';

type LeaveState = {
  step: LeaveStep;
  employeeId: string;
  leaveType?: LeaveType;
  fromDate?: string;
  toDate?: string;
  reason?: string;
  updatedAt: number;
};

type LeaveSubmission = (
  payload: ApplyLeavePayload,
) => Promise<{ success: boolean; error?: string; message?: string }>;

type LeaveFlowOptions = {
  submitLeave?: LeaveSubmission;
  now?: () => Date;
};

const LEAVE_TYPES: LeaveType[] = ['Casual', 'Sick', 'Paid', 'Unpaid'];
const LEAVE_TRIGGER_PATTERN =
  /^\s*(apply\s+for\s+leave|apply\s+leave|request\s+leave|leave\s+request)\s*$/i;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const STATE_TTL_MS = 30 * 60 * 1000;

const isCancel = (text: string) => /^\s*(cancel|stop|exit|quit)\s*$/i.test(text);

const isValidIsoDate = (value: string) => {
  if (!ISO_DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isBefore = (left: string, right: string) =>
  new Date(`${left}T00:00:00.000Z`) < new Date(`${right}T00:00:00.000Z`);

const getTodayIso = (now: Date) => {
  const localMidnight = new Date(now);
  localMidnight.setHours(0, 0, 0, 0);

  const year = localMidnight.getFullYear();
  const month = String(localMidnight.getMonth() + 1).padStart(2, '0');
  const day = String(localMidnight.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getEmployeeReference = (employee: VerifiedEmployee) =>
  employee.empId || employee.employeeId || employee.id;

const normalizeLeaveType = (value: string): LeaveType | null => {
  const trimmed = value.trim();

  const numericChoice = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(numericChoice) && LEAVE_TYPES[numericChoice - 1]) {
    return LEAVE_TYPES[numericChoice - 1];
  }

  return LEAVE_TYPES.find((leaveType) => leaveType.toLowerCase() === trimmed.toLowerCase()) ?? null;
};

const leaveTypePrompt = () =>
  [
    "Sure. Let's create your leave request.",
    'Reply with the leave type:',
    '1. Casual',
    '2. Sick',
    '3. Paid',
    '4. Unpaid',
    'You can reply with the number or the name. Reply CANCEL anytime to stop.',
  ].join('\n');

const confirmPrompt = (state: LeaveState) =>
  [
    'Please confirm your leave request:',
    `Employee ID: ${state.employeeId}`,
    `Leave type: ${state.leaveType}`,
    `From: ${state.fromDate}`,
    `To: ${state.toDate}`,
    `Reason: ${state.reason}`,
    'Reply YES to submit or NO to cancel.',
  ].join('\n');

export function createLeaveRequestFlow({
  submitLeave = applyLeave,
  now = () => new Date(),
}: LeaveFlowOptions = {}) {
  const leaveStates = new Map<string, LeaveState>();

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

  const clearState = (stateKey: string) => {
    leaveStates.delete(stateKey);
  };

  return async function handleLeaveRequestFlow(
    text: string,
    employee: VerifiedEmployee,
  ): Promise<string | null> {
    const trimmedText = text.trim();
    const stateKey = getEmployeeReference(employee);
    const existingState = getActiveState(stateKey);

    if (!existingState && !LEAVE_TRIGGER_PATTERN.test(trimmedText)) {
      return null;
    }

    if (isCancel(trimmedText)) {
      clearState(stateKey);
      return 'Leave request cancelled.';
    }

    if (!existingState) {
      saveState(stateKey, {
        step: 'AWAITING_LEAVE_TYPE',
        employeeId: getEmployeeReference(employee),
        updatedAt: Date.now(),
      });

      return leaveTypePrompt();
    }

    if (existingState.step === 'AWAITING_LEAVE_TYPE') {
      const leaveType = normalizeLeaveType(trimmedText);

      if (!leaveType) {
        return 'Please choose a valid leave type: Casual, Sick, Paid, or Unpaid.';
      }

      saveState(stateKey, {
        ...existingState,
        step: 'AWAITING_LEAVE_START_DATE',
        leaveType,
      });

      return 'Got it. Please enter the start date in YYYY-MM-DD format.';
    }

    if (existingState.step === 'AWAITING_LEAVE_START_DATE') {
      if (!isValidIsoDate(trimmedText)) {
        return 'Please enter a valid start date in YYYY-MM-DD format.';
      }

      if (isBefore(trimmedText, getTodayIso(now()))) {
        return 'Start date cannot be in the past. Please enter a current or future date.';
      }

      saveState(stateKey, {
        ...existingState,
        step: 'AWAITING_LEAVE_END_DATE',
        fromDate: trimmedText,
      });

      return 'Thanks. Please enter the end date in YYYY-MM-DD format.';
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

      return 'Noted. Please share a short reason for your leave.';
    }

    if (existingState.step === 'AWAITING_LEAVE_REASON') {
      if (trimmedText.length < 3) {
        return 'Please enter a short reason with at least 3 characters.';
      }

      const nextState: LeaveState = {
        ...existingState,
        step: 'AWAITING_LEAVE_CONFIRMATION',
        reason: trimmedText,
      };
      saveState(stateKey, nextState);

      return confirmPrompt(nextState);
    }

    if (existingState.step === 'AWAITING_LEAVE_CONFIRMATION') {
      if (/^\s*(no|n)\s*$/i.test(trimmedText)) {
        clearState(stateKey);
        return 'Leave request cancelled.';
      }

      if (!/^\s*(yes|y|confirm)\s*$/i.test(trimmedText)) {
        return 'Please reply YES to submit or NO to cancel.';
      }

      const result = await submitLeave({
        empId: existingState.employeeId,
        employeeId: existingState.employeeId,
        fromDate: existingState.fromDate!,
        toDate: existingState.toDate!,
        reason: existingState.reason!,
        leaveType: existingState.leaveType!,
      });

      clearState(stateKey);

      if (!result.success) {
        return `I could not apply your leave: ${result.error ?? 'Please try again later.'}`;
      }

      return 'Your leave request has been submitted and is now pending approval in HRMS.';
    }

    return null;
  };
}

export const handleLeaveRequestFlow = createLeaveRequestFlow();
