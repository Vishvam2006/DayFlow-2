import { getHrmsErrorMessage, hrmsApi } from './client.js';

export type HrmsTask = {
  _id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: string;
  assignedBy?: {
    name?: string;
  };
};

type TasksResponse = {
  success: boolean;
  tasks: HrmsTask[];
  error?: string;
  message?: string;
};

type TaskUpdateResponse = {
  success: boolean;
  task?: HrmsTask;
  error?: string;
  message?: string;
};

export async function fetchAssignedTasks(employeeId: string): Promise<TasksResponse> {
  try {
    const response = await hrmsApi.get<TasksResponse>('/api/bot/tasks', {
      params: { employeeId },
    });

    return response.data;
  } catch (error) {
    return {
      success: false,
      tasks: [],
      error: getHrmsErrorMessage(error, 'Could not fetch tasks.'),
    };
  }
}

export async function completeAssignedTask(
  employeeId: string,
  taskId: string,
): Promise<TaskUpdateResponse> {
  try {
    const response = await hrmsApi.patch<TaskUpdateResponse>(
      `/api/bot/tasks/${encodeURIComponent(taskId)}/complete`,
      { employeeId },
    );

    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getHrmsErrorMessage(error, 'Could not update task.'),
    };
  }
}
