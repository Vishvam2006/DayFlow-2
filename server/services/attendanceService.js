import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { getMonthRange, roundToNumber, toDateKey } from "../utils/date.js";
import { verifyIpAgainstCompanyNetwork } from "./networkSecurityService.js";

const HALF_DAY_HOURS = 4;
const FULL_DAY_HOURS = 8;
const LATE_AFTER_HOUR = Number.parseInt(process.env.ATTENDANCE_LATE_AFTER_HOUR ?? "10", 10);
const LATE_AFTER_MINUTE = Number.parseInt(process.env.ATTENDANCE_LATE_AFTER_MINUTE ?? "15", 10);

const createError = (message, statusCode, extra = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
};

const toMonthDateRange = (month) => {
  let range;

  try {
    range = getMonthRange(month);
  } catch (error) {
    throw createError(error.message || "Invalid month parameter.", 400);
  }

  const { month: normalizedMonth, start, end } = range;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { month: normalizedMonth, start, end };
};

export function calculateAttendanceStatus(workHours) {
  if (workHours >= FULL_DAY_HOURS) return "Present";
  if (workHours >= HALF_DAY_HOURS) return "Half Day";
  return "Absent";
}

export function calculateArrivalStatus(checkInAt) {
  if (!(checkInAt instanceof Date) || Number.isNaN(checkInAt.getTime())) {
    return "Unknown";
  }

  const threshold = new Date(checkInAt);
  threshold.setHours(LATE_AFTER_HOUR, LATE_AFTER_MINUTE, 0, 0);

  return checkInAt > threshold ? "Late" : "On Time";
}

export function serializeAttendanceRecord(attendance) {
  if (!attendance) {
    return null;
  }

  return {
    _id: attendance._id,
    date: attendance.date,
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    workHours: roundToNumber(attendance.workHours || 0),
    status: attendance.status,
    arrivalStatus: attendance.arrivalStatus || "Unknown",
    verificationStatus: attendance.verificationStatus,
    isFlagged: Boolean(attendance.isFlagged),
    flagReason: attendance.flagReason || "",
    networkName: attendance.networkName || "",
    deviceIP: attendance.deviceIP || "",
    isCheckedIn: Boolean(attendance.checkIn),
    isCheckedOut: Boolean(attendance.checkOut),
  };
}

export async function checkInEmployee({ employeeId, deviceIP = "" }) {
  if (!employeeId) {
    throw createError("Employee ID is required.", 400);
  }

  const today = toDateKey();
  const todayStart = new Date(`${today}T00:00:00.000`);
  const todayEnd = new Date(`${today}T23:59:59.999`);
  const verification = deviceIP
    ? await verifyIpAgainstCompanyNetwork(deviceIP)
    : { authorized: false, reason: "ip_unavailable", network: null };
  const isFlagged = !verification.authorized;

  const existing = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (existing) {
    throw createError(
      existing.checkOut
        ? "Attendance is already marked for today."
        : "You are already checked in for today and still need to check out.",
      409,
      { code: "already_checked_in", attendance: existing },
    );
  }

  const approvedLeave = await Leave.findOne({
    employee: employeeId,
    status: "Approved",
    fromDate: { $lte: todayEnd },
    toDate: { $gte: todayStart },
  });

  if (approvedLeave) {
    throw createError("You already have approved leave for today.", 400, {
      code: "approved_leave_exists",
    });
  }

  const now = new Date();
  const attendance = new Attendance({
    employee: employeeId,
    date: today,
    checkIn: now,
    deviceIP,
    verificationStatus: isFlagged ? "Flagged" : "Verified",
    isFlagged,
    flagReason: isFlagged
      ? verification.reason === "ip_unavailable"
        ? "Unable to detect public IP"
        : "Check-in from unapproved network"
      : "",
    networkName: verification.network?.officeName || "",
    arrivalStatus: calculateArrivalStatus(now),
  });

  try {
    await attendance.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw createError("Attendance is already marked for today.", 409, {
        code: "duplicate_attendance_record",
      });
    }

    throw error;
  }

  return {
    attendance,
    isFlagged,
    networkVerification: {
      authorized: verification.authorized,
      code: verification.reason,
      deviceIP,
      officeName: verification.network?.officeName || null,
    },
  };
}

export async function checkOutEmployee({ employeeId }) {
  if (!employeeId) {
    throw createError("Employee ID is required.", 400);
  }

  const today = toDateKey();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  if (!attendance) {
    throw createError("Check in is required before check-out.", 400, {
      code: "missing_check_in",
    });
  }

  if (attendance.checkOut) {
    throw createError("You have already checked out for today.", 409, {
      code: "already_checked_out",
      attendance,
    });
  }

  const checkOutAt = new Date();
  const diff = (checkOutAt - attendance.checkIn) / (1000 * 60 * 60);

  attendance.checkOut = checkOutAt;
  attendance.workHours = roundToNumber(diff);
  attendance.status = calculateAttendanceStatus(diff);
  if (!attendance.arrivalStatus) {
    attendance.arrivalStatus = calculateArrivalStatus(attendance.checkIn);
  }

  await attendance.save();

  return {
    attendance,
    workHours: attendance.workHours,
  };
}

export async function getTodayAttendanceForEmployee({ employeeId }) {
  if (!employeeId) {
    throw createError("Employee ID is required.", 400);
  }

  const today = toDateKey();
  const attendance = await Attendance.findOne({
    employee: employeeId,
    date: today,
  });

  return attendance;
}

export async function getYearAttendanceForEmployee({ employeeId, year }) {
  if (!employeeId) {
    throw createError("Employee ID is required.", 400);
  }

  const normalizedYear = Number(year) || new Date().getFullYear();
  if (!Number.isInteger(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2100) {
    throw createError("Invalid year parameter.", 400);
  }

  return Attendance.find({
    employee: employeeId,
    date: { $gte: `${normalizedYear}-01-01`, $lte: `${normalizedYear}-12-31` },
  });
}

export async function getAttendanceLogsForEmployee({
  employeeId,
  page = 1,
  limit = 8,
}) {
  if (!employeeId) {
    throw createError("Employee ID is required.", 400);
  }

  const skip = (page - 1) * limit;
  const [records, totalItems] = await Promise.all([
    Attendance.find({ employee: employeeId })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments({ employee: employeeId }),
  ]);

  return {
    records: records.map(serializeAttendanceRecord),
    totalItems,
  };
}

export async function getMonthlyAttendanceSummaryForEmployee({ employeeId, month }) {
  if (!employeeId) {
    throw createError("Employee ID is required.", 400);
  }

  const { month: normalizedMonth, start, end } = toMonthDateRange(month);
  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: toDateKey(start), $lte: toDateKey(end) },
  }).sort({ date: 1 });

  const summary = {
    month: normalizedMonth,
    totalRecords: records.length,
    presentDays: 0,
    halfDays: 0,
    absentDays: 0,
    lateDays: 0,
    incompleteDays: 0,
    flaggedDays: 0,
    totalWorkHours: 0,
    latestRecord: records.length ? serializeAttendanceRecord(records[records.length - 1]) : null,
  };

  for (const record of records) {
    if (record.arrivalStatus === "Late") summary.lateDays += 1;
    if (record.isFlagged) summary.flaggedDays += 1;
    if (record.checkIn && !record.checkOut) {
      summary.incompleteDays += 1;
      summary.totalWorkHours += record.workHours || 0;
      continue;
    }

    if (record.status === "Present") summary.presentDays += 1;
    else if (record.status === "Half Day") summary.halfDays += 1;
    else summary.absentDays += 1;

    summary.totalWorkHours += record.workHours || 0;
  }

  summary.totalWorkHours = roundToNumber(summary.totalWorkHours);

  return {
    month: normalizedMonth,
    records,
    summary,
  };
}

export async function createAbsentAttendanceRecord({ employeeId, date }) {
  const attendance = new Attendance({
    employee: employeeId,
    date,
    status: "Absent",
    arrivalStatus: "Unknown",
  });

  try {
    await attendance.save();
  } catch (error) {
    if (error?.code === 11000) {
      return null;
    }

    throw error;
  }

  return attendance;
}
