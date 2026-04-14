import { getHrmsErrorMessage, hrmsApi } from './client.js';

export type PendingLeaveNotification = {
  leaveId: string;
  status: 'Approved' | 'Rejected';
  leaveType: 'Casual' | 'Sick' | 'Paid' | 'Unpaid';
  fromDate: string;
  toDate: string;
  reason?: string;
  decisionComment?: string;
  employee: {
    id: string;
    name: string;
    email?: string;
    empId: string;
    employeeId: string;
    phoneNumber?: string;
    department?: string;
  } | null;
};

type ClaimLeaveNotificationsResponse = {
  success: boolean;
  notifications: PendingLeaveNotification[];
  error?: string;
};

type LeaveNotificationAckResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function claimPendingLeaveNotifications(
  limit = 10,
): Promise<ClaimLeaveNotificationsResponse> {
  try {
    const response = await hrmsApi.post<ClaimLeaveNotificationsResponse>(
      '/api/bot/leave-notifications/claim',
      { limit },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      notifications: [],
      error: getHrmsErrorMessage(error, 'Could not fetch leave notifications.'),
    };
  }
}

export async function acknowledgeLeaveNotification(
  leaveId: string,
  status: 'Approved' | 'Rejected',
): Promise<LeaveNotificationAckResponse> {
  try {
    const response = await hrmsApi.post<LeaveNotificationAckResponse>(
      `/api/bot/leave-notifications/${encodeURIComponent(leaveId)}/ack`,
      { status },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Could not acknowledge leave notification.'),
    };
  }
}

export async function reportLeaveNotificationFailure(
  leaveId: string,
  status: 'Approved' | 'Rejected',
  errorMessage: string,
): Promise<LeaveNotificationAckResponse> {
  try {
    const response = await hrmsApi.post<LeaveNotificationAckResponse>(
      `/api/bot/leave-notifications/${encodeURIComponent(leaveId)}/fail`,
      { status, error: errorMessage },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Could not report leave notification failure.'),
    };
  }
}
