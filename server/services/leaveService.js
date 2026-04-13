import Leave from "../models/Leave.js";

const normalizeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const createLeaveRequest = async ({
  employeeId,
  leaveType = "Casual",
  fromDate,
  toDate,
  reason = "",
}) => {
  if (!employeeId || !leaveType || !fromDate || !toDate) {
    const error = new Error("Required Field Missing");
    error.statusCode = 400;
    throw error;
  }

  const from = normalizeDate(fromDate);
  const to = normalizeDate(toDate);

  if (!from || !to) {
    const error = new Error("Invalid date format");
    error.statusCode = 400;
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  if (from < today) {
    const error = new Error("Cannot apply leave for past dates");
    error.statusCode = 400;
    throw error;
  }

  if (to < from) {
    const error = new Error("Invalid date range");
    error.statusCode = 400;
    throw error;
  }

  const overlappingLeave = await Leave.findOne({
    employee: employeeId,
    status: { $in: ["Pending", "Approved"] },
    fromDate: { $lte: to },
    toDate: { $gte: from },
  });

  if (overlappingLeave) {
    const error = new Error("You already have a leave request for the selected dates");
    error.statusCode = 409;
    throw error;
  }

  const leave = new Leave({
    employee: employeeId,
    leaveType,
    fromDate: from,
    toDate: to,
    reason,
  });

  await leave.save();
  return leave;
};

export { createLeaveRequest };
