import { getHrmsErrorMessage, hrmsApi, isRetryableHrmsError } from './client.js';

export type ApplyLeavePayload = {
  employeeId?: string;
  empId?: string;
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
    const request = () => hrmsApi.post<ApplyLeaveResponse>('/api/bot/leaves/apply', payload);

    let response;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await request();
        break;
      } catch (error) {
        if (!isRetryableHrmsError(error) || attempt === 2) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }

    if (!response) {
      throw new Error('Leave submission did not return a response.');
    }

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Leave request failed.'),
    };
  }
}
