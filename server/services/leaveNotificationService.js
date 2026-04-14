import Leave from "../models/Leave.js";

const RETRY_DELAY_MS = Number.parseInt(
  process.env.LEAVE_NOTIFICATION_RETRY_DELAY_MS ?? `${60 * 1000}`,
  10,
);

const NOTIFIABLE_STATUSES = ["Approved", "Rejected"];

const sanitizeDecisionComment = (value) =>
  typeof value === "string" ? value.trim() : "";

export function isNotifiableLeaveStatus(status) {
  return NOTIFIABLE_STATUSES.includes(status);
}

export async function updateLeaveStatusAndQueueNotification({
  leaveId,
  status,
  decisionComment = "",
}) {
  const normalizedComment = sanitizeDecisionComment(decisionComment);
  const leave = await Leave.findById(leaveId).populate(
    "employee",
    "name email employeeId phoneNumber department",
  );

  if (!leave) {
    const error = new Error("Leave not found");
    error.statusCode = 404;
    throw error;
  }

  const statusChanged = leave.status !== status;

  leave.status = status;
  leave.decisionComment = normalizedComment;
  if (!leave.notification) {
    leave.notification = {};
  }

  if (statusChanged && isNotifiableLeaveStatus(status)) {
    leave.notification.lastAttemptedStatus = null;
    leave.notification.lastAttemptedAt = null;
    leave.notification.lastError = "";
  }

  await leave.save();
  return leave;
}

function canRetryNotification(notification = {}, status, now) {
  if (!notification.lastAttemptedAt) return true;
  if (notification.lastAttemptedStatus !== status) return true;

  const attemptedAt = new Date(notification.lastAttemptedAt);
  if (Number.isNaN(attemptedAt.getTime())) return true;

  return now.getTime() - attemptedAt.getTime() >= RETRY_DELAY_MS;
}

export async function claimPendingLeaveNotifications(limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 25));
  const now = new Date();

  const candidates = await Leave.find({
    $or: [
      { status: "Approved", "notification.lastStatusNotified": { $ne: "Approved" } },
      { status: "Rejected", "notification.lastStatusNotified": { $ne: "Rejected" } },
    ],
  })
    .populate("employee", "name email employeeId phoneNumber department")
    .sort({ updatedAt: 1 })
    .limit(safeLimit * 3);

  const claimed = [];

  for (const leave of candidates) {
    if (!isNotifiableLeaveStatus(leave.status)) {
      continue;
    }

    if (!canRetryNotification(leave.notification, leave.status, now)) {
      continue;
    }

    const updated = await Leave.findOneAndUpdate(
      {
        _id: leave._id,
        status: leave.status,
        $or: [
          { status: "Approved", "notification.lastStatusNotified": { $ne: "Approved" } },
          { status: "Rejected", "notification.lastStatusNotified": { $ne: "Rejected" } },
        ],
      },
      {
        $set: {
          "notification.lastAttemptedStatus": leave.status,
          "notification.lastAttemptedAt": now,
        },
      },
      { returnDocument: "after" },
    ).populate("employee", "name email employeeId phoneNumber department");

    if (!updated) {
      continue;
    }

    claimed.push(updated);
    if (claimed.length >= safeLimit) {
      break;
    }
  }

  return claimed;
}

export async function markLeaveNotificationDelivered({ leaveId, status }) {
  const leave = await Leave.findOneAndUpdate(
    {
      _id: leaveId,
      status,
    },
    {
      $set: {
        "notification.lastStatusNotified": status,
        "notification.lastNotifiedAt": new Date(),
        "notification.lastError": "",
        "notification.lastAttemptedStatus": status,
        "notification.lastAttemptedAt": new Date(),
      },
    },
    { returnDocument: "after" },
  );

  return leave;
}

export async function markLeaveNotificationFailed({ leaveId, status, errorMessage }) {
  const leave = await Leave.findOneAndUpdate(
    {
      _id: leaveId,
      status,
    },
    {
      $set: {
        "notification.lastAttemptedStatus": status,
        "notification.lastAttemptedAt": new Date(),
        "notification.lastError": sanitizeDecisionComment(errorMessage).slice(0, 300),
      },
    },
    { returnDocument: "after" },
  );

  return leave;
}
