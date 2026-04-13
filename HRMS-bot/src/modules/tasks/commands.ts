import type { VerifiedEmployee } from '../hrms/employeeVerifier.js';
import {
  completeAssignedTask,
  fetchAssignedTasks,
  type HrmsTask,
} from '../hrms/tasks.js';

const TASKS_COMMAND_PATTERN = /^\s*!tasks\s*$/i;
const COMPLETE_COMMAND_PATTERN = /^\s*!complete\s+([a-f\d]{24})\s*$/i;

const formatDate = (value?: string) => {
  if (!value) return 'No due date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';

  return date.toISOString().slice(0, 10);
};

const formatTask = (task: HrmsTask) =>
  [
    `${task.title}`,
    `ID: ${task._id}`,
    `Status: ${task.status}`,
    `Priority: ${task.priority}`,
    `Due: ${formatDate(task.dueDate)}`,
  ].join('\n');

export async function handleTaskCommand(
  text: string,
  employee: VerifiedEmployee,
): Promise<string | null> {
  if (TASKS_COMMAND_PATTERN.test(text)) {
    const result = await fetchAssignedTasks(employee.employeeId);

    if (!result.success) {
      return `I could not fetch your tasks: ${result.error ?? 'Please try again later.'}`;
    }

    if (result.tasks.length === 0) {
      return 'You do not have any assigned tasks right now.';
    }

    return [
      'Your assigned tasks:',
      ...result.tasks.map((task, index) => `${index + 1}. ${formatTask(task)}`),
      '',
      'Reply with !complete <task ID> to mark a task as completed.',
    ].join('\n\n');
  }

  const completeMatch = text.match(COMPLETE_COMMAND_PATTERN);
  if (!completeMatch && !/^\s*!complete\b/i.test(text)) {
    return null;
  }

  if (!completeMatch) {
    return 'Please use this format: !complete <task ID>';
  }

  const taskId = completeMatch[1];
  const result = await completeAssignedTask(employee.employeeId, taskId);

  if (!result.success) {
    return `I could not complete that task: ${result.error ?? 'Please try again later.'}`;
  }

  return `Marked "${result.task?.title ?? 'task'}" as completed.`;
}
