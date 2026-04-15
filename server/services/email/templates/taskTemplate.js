import { buildEmailLayout } from "./baseTemplate.js";

export function buildTaskNotificationTemplate({
  employeeName,
  title,
  description = "",
  priority = "Medium",
  dueDate = "",
  assignedByName = "Your HRMS admin",
  dashboardUrl = "",
}) {
  const html = buildEmailLayout({
    title: `New task assigned: ${title}`,
    previewText: `A new ${priority.toLowerCase()} priority task has been assigned to you.`,
    eyebrow: "Task Assignment",
    heading: "You have a new task",
    intro: `Hello ${employeeName}, ${assignedByName} assigned a new task to you in DayFlow HRMS.`,
    bodyHtml: `
      <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;">
        <p style="margin:0 0 10px;font-size:20px;line-height:1.4;color:#0f172a;font-weight:700;">${title}</p>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#475569;">
          ${description || "Please review the task details in the HRMS dashboard."}
        </p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">
          <strong>Priority:</strong> ${priority}
          ${dueDate ? `<br /><strong>Due date:</strong> ${dueDate}` : ""}
        </p>
      </div>
    `,
    cta: dashboardUrl ? { label: "Open my tasks", href: dashboardUrl } : null,
  });

  const text = [
    `Hello ${employeeName},`,
    "",
    `${assignedByName} assigned a new task to you.`,
    `Task: ${title}`,
    `Priority: ${priority}`,
    dueDate ? `Due date: ${dueDate}` : "",
    description ? `Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `New task assigned - ${title}`,
    html,
    text,
  };
}
