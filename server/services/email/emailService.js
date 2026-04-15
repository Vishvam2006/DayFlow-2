import { Resend } from "resend";
import { buildOtpEmailTemplate } from "./templates/otpTemplate.js";
import { buildLeaveStatusEmailTemplate } from "./templates/leaveTemplate.js";
import { buildTaskNotificationTemplate } from "./templates/taskTemplate.js";

const EMAIL_RETRY_ATTEMPTS = Math.max(
  1,
  Number.parseInt(process.env.EMAIL_RETRY_ATTEMPTS ?? "2", 10) || 2,
);
const EMAIL_RETRY_DELAY_MS = Math.max(
  0,
  Number.parseInt(process.env.EMAIL_RETRY_DELAY_MS ?? "750", 10) || 750,
);

let resendClient = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

function getEmailConfig() {
  const from = process.env.EMAIL_FROM?.trim();

  if (!from) {
    throw new Error("Missing EMAIL_FROM.");
  }

  return {
    from,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
    appName: process.env.EMAIL_APP_NAME?.trim() || "DayFlow HRMS",
    appUrl: process.env.APP_URL?.trim() || "",
  };
}

function logEmail(level, message, meta = {}) {
  const logger = level === "error" ? console.error : console.info;
  logger(`[email] ${message}`, meta);
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  tags = [],
  replyTo,
}) {
  const client = getResendClient();
  const config = getEmailConfig();

  let lastError = null;

  for (let attempt = 1; attempt <= EMAIL_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.emails.send({
        from: config.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        replyTo: replyTo || config.replyTo,
        tags,
      });

      logEmail("info", "sent", {
        subject,
        to: Array.isArray(to) ? to : [to],
        id: response?.data?.id || null,
        attempt,
      });

      return response;
    } catch (error) {
      lastError = error;
      logEmail("error", "failed", {
        subject,
        to: Array.isArray(to) ? to : [to],
        attempt,
        error: error?.message || String(error),
      });

      if (attempt < EMAIL_RETRY_ATTEMPTS) {
        await sleep(EMAIL_RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

export function queueEmail(jobName, handler) {
  Promise.resolve()
    .then(handler)
    .then(() => {
      logEmail("info", `job completed: ${jobName}`);
    })
    .catch((error) => {
      logEmail("error", `job failed: ${jobName}`, {
        error: error?.message || String(error),
      });
    });
}

export async function sendOTP({ email, otp, expiresInMinutes = 5 }) {
  const template = buildOtpEmailTemplate({ otp, expiresInMinutes });
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: "category", value: "otp" }],
  });
}

export async function sendLeaveStatusUpdate({
  email,
  employeeName,
  status,
  leaveType,
  fromDate,
  toDate,
  decisionComment,
  dashboardUrl,
}) {
  const template = buildLeaveStatusEmailTemplate({
    employeeName,
    status,
    leaveType,
    fromDate,
    toDate,
    decisionComment,
    dashboardUrl,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: "category", value: "leave-status" }],
  });
}

export async function sendTaskNotification({
  email,
  employeeName,
  title,
  description,
  priority,
  dueDate,
  assignedByName,
  dashboardUrl,
}) {
  const template = buildTaskNotificationTemplate({
    employeeName,
    title,
    description,
    priority,
    dueDate,
    assignedByName,
    dashboardUrl,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: "category", value: "task-assignment" }],
  });
}
