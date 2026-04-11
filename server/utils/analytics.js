export function calculateMetrics(emp) {
  const productivity = emp.completedTasks / emp.assignedTasks || 0;
  const leave_ratio = emp.leavesTaken / emp.workingDays || 0;
  const attendance_score = emp.presentDays / emp.totalDays || 0;

  return { productivity, leave_ratio, attendance_score };
}

export function calculateRisk({ productivity, leave_ratio, attendance_score, tasks_assigned }) {
  let score = 0;

  if (productivity < 0.5) score += 30;
  if (leave_ratio > 0.2) score += 30;
  if (attendance_score < 0.75) score += 20;
  if (tasks_assigned > 20 && productivity < 0.6) score += 20;

  let level = "Low";
  if (score >= 70) level = "High";
  else if (score >= 40) level = "Medium";

  return { score, level };
}