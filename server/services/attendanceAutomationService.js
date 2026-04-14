import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { createAbsentAttendanceRecord } from "./attendanceService.js";

const DEFAULT_TIME_ZONE = process.env.ATTENDANCE_AUTOMATION_TZ || "Asia/Kolkata";
const DEFAULT_RUN_AT = process.env.ATTENDANCE_AUTOMATION_RUN_AT || "00:30";
const CHECK_INTERVAL_MS = Number.parseInt(
  process.env.ATTENDANCE_AUTOMATION_CHECK_INTERVAL_MS ?? `${60 * 1000}`,
  10,
);

let automationTimer = null;
let lastProcessedDateKey = "";

const pad = (value) => String(value).padStart(2, "0");

const isWeekday = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
};

export function getDatePartsInTimeZone(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function getPreviousDateKey(dateKey) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function shouldRunAttendanceAutomation({
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  runAt = DEFAULT_RUN_AT,
  alreadyRanForDate = "",
}) {
  const { hour, minute, dateKey } = getDatePartsInTimeZone(now, timeZone);
  const [runHour, runMinute] = runAt.split(":").map((value) => Number.parseInt(value, 10));

  if (
    !Number.isInteger(runHour) ||
    !Number.isInteger(runMinute) ||
    runHour < 0 ||
    runHour > 23 ||
    runMinute < 0 ||
    runMinute > 59
  ) {
    return false;
  }

  if (alreadyRanForDate === dateKey) {
    return false;
  }

  return hour > runHour || (hour === runHour && minute >= runMinute);
}

export async function markMissingAttendanceAsAbsent({
  dateKey,
  weekdaysOnly = true,
} = {}) {
  if (!dateKey) {
    throw new Error("dateKey is required for attendance automation.");
  }

  if (weekdaysOnly && !isWeekday(dateKey)) {
    return {
      dateKey,
      skipped: true,
      reason: "non_working_day",
      createdCount: 0,
      employeeIds: [],
    };
  }

  const employees = await User.find({ role: "employee" }).select("_id employeeId");

  if (!employees.length) {
    return {
      dateKey,
      skipped: false,
      reason: "no_employees",
      createdCount: 0,
      employeeIds: [],
    };
  }

  const attendanceRecords = await Attendance.find({ date: dateKey }).select("employee");
  const existingEmployeeIds = new Set(attendanceRecords.map((record) => String(record.employee)));

  const absentCandidates = employees.filter(
    (employee) => !existingEmployeeIds.has(String(employee._id)),
  );

  if (!absentCandidates.length) {
    return {
      dateKey,
      skipped: false,
      reason: "no_missing_records",
      createdCount: 0,
      employeeIds: [],
    };
  }

  const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);
  const approvedLeaves = await Leave.find({
    employee: { $in: absentCandidates.map((employee) => employee._id) },
    status: "Approved",
    fromDate: { $lte: dayEnd },
    toDate: { $gte: dayStart },
  }).select("employee");

  const leaveEmployeeIds = new Set(approvedLeaves.map((leave) => String(leave.employee)));
  const employeesToMarkAbsent = absentCandidates.filter(
    (employee) => !leaveEmployeeIds.has(String(employee._id)),
  );

  const createdEmployeeIds = [];

  for (const employee of employeesToMarkAbsent) {
    const created = await createAbsentAttendanceRecord({
      employeeId: employee._id,
      date: dateKey,
    });

    if (created) {
      createdEmployeeIds.push(employee.employeeId || String(employee._id));
    }
  }

  return {
    dateKey,
    skipped: false,
    reason: "completed",
    createdCount: createdEmployeeIds.length,
    employeeIds: createdEmployeeIds,
  };
}

export async function runAttendanceAutomationCycle({
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  runAt = DEFAULT_RUN_AT,
  weekdaysOnly = true,
} = {}) {
  if (
    !shouldRunAttendanceAutomation({
      now,
      timeZone,
      runAt,
      alreadyRanForDate: lastProcessedDateKey,
    })
  ) {
    return null;
  }

  const { dateKey } = getDatePartsInTimeZone(now, timeZone);
  const targetDateKey = getPreviousDateKey(dateKey);
  const result = await markMissingAttendanceAsAbsent({
    dateKey: targetDateKey,
    weekdaysOnly,
  });

  lastProcessedDateKey = dateKey;
  return result;
}

export function startAttendanceAutomation({
  logger = console,
  timeZone = DEFAULT_TIME_ZONE,
  runAt = DEFAULT_RUN_AT,
  weekdaysOnly = true,
} = {}) {
  if (String(process.env.ATTENDANCE_AUTOMATION_ENABLED ?? "true") === "false") {
    logger.info?.("Attendance automation disabled by configuration.");
    return null;
  }

  if (automationTimer) {
    return automationTimer;
  }

  const runCycle = async () => {
    try {
      const result = await runAttendanceAutomationCycle({
        now: new Date(),
        timeZone,
        runAt,
        weekdaysOnly,
      });

      if (result) {
        logger.info?.(
          {
            dateKey: result.dateKey,
            createdCount: result.createdCount,
            reason: result.reason,
          },
          "Attendance automation cycle completed",
        );
      }
    } catch (error) {
      logger.error?.({ error }, "Attendance automation cycle failed");
    }
  };

  runCycle().catch(() => {});
  automationTimer = setInterval(runCycle, CHECK_INTERVAL_MS);
  if (typeof automationTimer.unref === "function") {
    automationTimer.unref();
  }

  logger.info?.(
    { timeZone, runAt, checkIntervalMs: CHECK_INTERVAL_MS },
    "Attendance automation started",
  );

  return automationTimer;
}

export function stopAttendanceAutomation() {
  if (automationTimer) {
    clearInterval(automationTimer);
    automationTimer = null;
  }
}

export function resetAttendanceAutomationState() {
  lastProcessedDateKey = "";
  stopAttendanceAutomation();
}
