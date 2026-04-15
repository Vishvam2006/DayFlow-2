import { buildEmailLayout } from "./baseTemplate.js";

const STATUS_COLORS = {
  Approved: { label: "Approved", color: "#166534", bg: "#dcfce7" },
  Rejected: { label: "Rejected", color: "#991b1b", bg: "#fee2e2" },
  Pending: { label: "Pending", color: "#92400e", bg: "#fef3c7" },
};

export function buildLeaveStatusEmailTemplate({
  employeeName,
  status,
  leaveType,
  fromDate,
  toDate,
  decisionComment = "",
  dashboardUrl = "",
}) {
  const palette = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  const title = `Your ${leaveType} leave request was ${palette.label.toLowerCase()}`;

  const html = buildEmailLayout({
    title,
    previewText: title,
    eyebrow: "Leave Update",
    heading: `Leave request ${palette.label.toLowerCase()}`,
    intro: `Hello ${employeeName}, your ${leaveType.toLowerCase()} leave request has been reviewed.`,
    bodyHtml: `
      <div style="margin-bottom:20px;">
        <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:${palette.bg};color:${palette.color};font-size:13px;font-weight:700;">
          ${palette.label}
        </span>
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Leave Type</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;" align="right">${leaveType}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">From</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;" align="right">${fromDate}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">To</td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:600;" align="right">${toDate}</td>
        </tr>
      </table>
      ${
        decisionComment
          ? `<div style="margin-top:20px;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Manager note</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;">${decisionComment}</p>
            </div>`
          : ""
      }
    `,
    cta: dashboardUrl ? { label: "View leave details", href: dashboardUrl } : null,
  });

  const text = [
    `Hello ${employeeName},`,
    "",
    `Your ${leaveType} leave request is now ${palette.label}.`,
    `From: ${fromDate}`,
    `To: ${toDate}`,
    decisionComment ? `Manager note: ${decisionComment}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Leave request ${palette.label.toLowerCase()} - ${leaveType}`,
    html,
    text,
  };
}
