import { getHrmsErrorMessage, hrmsApi } from './client.js';

export type HrmsAttendanceRecord = {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workHours: number;
  status: 'Present' | 'Half Day' | 'Absent';
  arrivalStatus?: 'On Time' | 'Late' | 'Unknown';
  verificationStatus?: 'Verified' | 'Flagged' | 'Rejected';
  isFlagged?: boolean;
  flagReason?: string;
  networkName?: string;
  isCheckedIn?: boolean;
  isCheckedOut?: boolean;
};

type AttendanceEmployee = {
  id: string;
  empId: string;
  employeeId: string;
  name: string;
};

type AttendanceApiBaseResponse = {
  success: boolean;
  error?: string;
  message?: string;
  code?: string;
  employee?: AttendanceEmployee;
};

type TodayAttendanceResponse = AttendanceApiBaseResponse & {
  attendance: HrmsAttendanceRecord | null;
};

type AttendanceMutationResponse = AttendanceApiBaseResponse & {
  attendance?: HrmsAttendanceRecord | null;
  isFlagged?: boolean;
  workHours?: number;
  networkVerification?: {
    authorized: boolean;
    code: string;
    deviceIP: string;
    officeName?: string | null;
  };
};

export type MonthlyAttendanceSummary = {
  month: string;
  totalRecords: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  lateDays: number;
  incompleteDays: number;
  flaggedDays: number;
  totalWorkHours: number;
  latestRecord: HrmsAttendanceRecord | null;
};

type MonthlyAttendanceResponse = AttendanceApiBaseResponse & {
  month: string;
  summary: MonthlyAttendanceSummary;
  records: HrmsAttendanceRecord[];
};

export async function fetchTodayAttendance(
  employeeId: string,
): Promise<TodayAttendanceResponse> {
  try {
    const response = await hrmsApi.get<TodayAttendanceResponse>('/api/bot/attendance/today', {
      params: { employeeId },
    });

    return response.data;
  } catch (error) {
    return {
      success: false,
      attendance: null,
      error: getHrmsErrorMessage(error, 'Could not fetch attendance status.'),
    };
  }
}

export async function checkInAttendance(
  employeeId: string,
): Promise<AttendanceMutationResponse> {
  try {
    const response = await hrmsApi.post<AttendanceMutationResponse>(
      '/api/bot/attendance/check-in',
      { employeeId },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Could not check in.'),
    };
  }
}

export async function checkOutAttendance(
  employeeId: string,
): Promise<AttendanceMutationResponse> {
  try {
    const response = await hrmsApi.post<AttendanceMutationResponse>(
      '/api/bot/attendance/check-out',
      { employeeId },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Could not check out.'),
    };
  }
}

export async function fetchMonthlyAttendanceSummary(
  employeeId: string,
  month?: string,
): Promise<MonthlyAttendanceResponse> {
  try {
    const response = await hrmsApi.get<MonthlyAttendanceResponse>(
      '/api/bot/attendance/monthly-summary',
      {
        params: { employeeId, month },
      },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      month: month ?? '',
      summary: {
        month: month ?? '',
        totalRecords: 0,
        presentDays: 0,
        halfDays: 0,
        absentDays: 0,
        lateDays: 0,
        incompleteDays: 0,
        flaggedDays: 0,
        totalWorkHours: 0,
        latestRecord: null,
      },
      records: [],
      error: getHrmsErrorMessage(error, 'Could not fetch monthly attendance summary.'),
    };
  }
}
