import { getHrmsErrorMessage, hrmsApi } from './client.js';

export type ApplyLeavePayload = {
  employeeId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  leaveType?: 'Casual' | 'Sick' | 'Paid' | 'Unpaid';
};

type ApplyLeaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function applyLeave(payload: ApplyLeavePayload): Promise<ApplyLeaveResponse> {
  try {
    const response = await hrmsApi.post<ApplyLeaveResponse>(
      '/api/bot/leaves/apply',
      payload,
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Leave request failed.'),
    };
  }
}
