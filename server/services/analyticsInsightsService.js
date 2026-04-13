import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Task from "../models/Task.js";
import AnalyticsInsight from "../models/AnalyticsInsight.js";
import { generateInsightsBatch } from "./groqService.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const EXCUSED_LEAVE_TYPES = new Set(["Sick"]);

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), 1);
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(Math.max(n, 0), 100));
}

function toYmdUtc(date) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayUtc(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUtc(date, days) {
  return new Date(startOfDayUtc(date).getTime() + days * DAY_MS);
}

function inclusiveDaysBetweenUtc(from, to) {
  const a = startOfDayUtc(from).getTime();
  const b = startOfDayUtc(to).getTime();
  if (b < a) return 0;
  return Math.floor((b - a) / DAY_MS) + 1;
}

function attendanceValue(status) {
  if (status === "Present") return 1;
  if (status === "Half Day") return 0.5;
  return 0;
}

function riskLevelFromScore(score) {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function safeRatio(top, bottom) {
  const t = Number(top);
  const b = Number(bottom);
  if (!Number.isFinite(t) || !Number.isFinite(b) || b <= 0) return 0;
  return clamp01(t / b);
}

function safeDeltaPercent(current, baseline) {
  const c = Number(current);
  const b = Number(baseline);
  if (!Number.isFinite(c) || !Number.isFinite(b)) return 0;
  if (b === 0) return c === 0 ? 0 : 1;
  return (c - b) / Math.abs(b);
}

function enumerateDatesUtc(start, end) {
  const dates = [];
  const s = startOfDayUtc(start);
  const e = startOfDayUtc(end);
  for (let t = s.getTime(); t <= e.getTime(); t += DAY_MS) {
    dates.push(new Date(t));
  }
  return dates;
}

function expandLeaveDatesUtc(leave) {
  const from = startOfDayUtc(leave.fromDate);
  const to = startOfDayUtc(leave.toDate);
  const dates = [];
  for (let t = from.getTime(); t <= to.getTime(); t += DAY_MS) {
    dates.push(toYmdUtc(new Date(t)));
  }
  return dates;
}

async function getAttendanceMap(employeeId, startYmd, endYmd) {
  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: startYmd, $lte: endYmd },
  }).select("date status workHours");

  const map = new Map();
  for (const r of records) {
    map.set(r.date, { status: r.status, workHours: Number(r.workHours) || 0 });
  }
  return map;
}

async function getApprovedLeaves(employeeId, start, end) {
  return await Leave.find({
    employee: employeeId,
    status: "Approved",
    $or: [{ fromDate: { $lte: end }, toDate: { $gte: start } }],
  }).select("leaveType fromDate toDate reason");
}

async function getTasksForPeriod(employeeId, start, end) {
  return await Task.find({
    assignedTo: employeeId,
    createdAt: { $lte: end },
  }).select("status createdAt updatedAt priority");
}

function computePeriodMetrics({
  datesUtc,
  attendanceMap,
  approvedLeaves,
  tasks,
  windowStart,
  windowEnd,
}) {
  const leaveDatesAll = new Set();
  const leaveDatesExcused = new Set();
  const leaveCountsByType = {};

  for (const l of approvedLeaves) {
    const type = l.leaveType || "Unknown";
    leaveCountsByType[type] = (leaveCountsByType[type] || 0) + inclusiveDaysBetweenUtc(l.fromDate, l.toDate);
    for (const ymd of expandLeaveDatesUtc(l)) {
      leaveDatesAll.add(ymd);
      if (EXCUSED_LEAVE_TYPES.has(type)) leaveDatesExcused.add(ymd);
    }
  }

  let attendanceDenominatorDays = 0;
  let attendedValueSum = 0;
  let workHoursSum = 0;

  const attendanceSeries = [];
  const excusedSeries = [];

  for (const d of datesUtc) {
    const ymd = toYmdUtc(d);
    const isOnLeave = leaveDatesAll.has(ymd);
    const isExcused = leaveDatesExcused.has(ymd);
    const attendance = attendanceMap.get(ymd);

    // For scoring, remove approved leave days from attendance denominator entirely.
    if (!isOnLeave) {
      attendanceDenominatorDays += 1;
      const value = attendanceValue(attendance?.status);
      attendedValueSum += value;
      workHoursSum += attendance?.workHours || 0;
      attendanceSeries.push(value);
    } else {
      // Represent leave days in series as null (not counted).
      attendanceSeries.push(null);
    }
    excusedSeries.push(isExcused);
  }

  const attendanceRate = safeRatio(attendedValueSum, attendanceDenominatorDays);
  const avgWorkHours = safeRatio(workHoursSum, attendanceDenominatorDays) * 8; // normalize ~0-8h scale

  // Tasks: use createdAt for assignments and updatedAt for completion time.
  const assignedInPeriod = tasks.filter((t) => t.createdAt >= windowStart && t.createdAt <= windowEnd);
  const completedInPeriod = tasks.filter(
    (t) => t.status === "Completed" && t.updatedAt >= windowStart && t.updatedAt <= windowEnd
  );

  const completionRate = safeRatio(completedInPeriod.length, assignedInPeriod.length);
  const velocityPerWeek = (completedInPeriod.length / Math.max(1, datesUtc.length / 7));

  // Break 30 days into 4-ish weeks for series compression
  const weeks = [];
  for (let i = 0; i < datesUtc.length; i += 7) {
    const wStart = datesUtc[i];
    const wEnd = datesUtc[Math.min(i + 6, datesUtc.length - 1)];
    const completed = completedInPeriod.filter((t) => t.updatedAt >= wStart && t.updatedAt <= wEnd).length;
    const assigned = assignedInPeriod.filter((t) => t.createdAt >= wStart && t.createdAt <= wEnd).length;
    weeks.push({
      start: toYmdUtc(wStart),
      end: toYmdUtc(wEnd),
      completed,
      assigned,
    });
  }

  const leaveDaysApproved = leaveDatesAll.size;
  const excusedLeaveDays = leaveDatesExcused.size;
  const nonExcusedLeaveDays = Math.max(0, leaveDaysApproved - excusedLeaveDays);

  return {
    metrics: {
      attendanceRate,
      attendanceDenominatorDays,
      avgWorkHours,
      tasksAssigned: assignedInPeriod.length,
      tasksCompleted: completedInPeriod.length,
      taskCompletionRate: completionRate,
      taskVelocityPerWeek: velocityPerWeek,
      leaveDaysApproved,
      leaveDaysByType: leaveCountsByType,
      excusedLeaveDays,
      nonExcusedLeaveDays,
    },
    series: {
      attendanceDaily: attendanceSeries,
      excusedLeaveDaily: excusedSeries,
      taskWeeks: weeks,
    },
  };
}

function computePerformanceAndRisk({ window, baseline, deltas }) {
  // Performance is oriented around trend vs baseline with guardrails.
  // Approved sick leave is already excluded from attendance denominator and does not penalize.
  const attendanceTrend = clamp01(0.5 + 0.5 * deltas.attendanceRate); // map -1..1 -> 0..1
  const completionTrend = clamp01(0.5 + 0.5 * deltas.taskCompletionRate);
  const velocityTrend = clamp01(0.5 + 0.5 * deltas.taskVelocityPerWeek);

  const attendanceAbs = clamp01(window.attendanceRate);
  const completionAbs = clamp01(window.taskCompletionRate);

  // Mild penalty for high non-excused leave usage in the window (e.g., repeated casual/unpaid)
  const leavePenalty = clamp01(window.nonExcusedLeaveDays / Math.max(1, window.attendanceDenominatorDays + window.leaveDaysApproved));

  const performance =
    100 *
    (0.35 * attendanceAbs +
      0.25 * completionAbs +
      0.15 * attendanceTrend +
      0.15 * velocityTrend +
      0.10 * completionTrend);

  const performanceScore = clampScore(performance - 10 * leavePenalty);

  // Risk is inverse of performance with additional signals for low attendance/completion.
  const riskRaw =
    (1 - attendanceAbs) * 35 +
    (1 - completionAbs) * 35 +
    clamp01(leavePenalty) * 15 +
    clamp01(1 - velocityTrend) * 15;
  const riskScore = clampScore(riskRaw);

  return {
    performanceScore,
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
  };
}

function buildFallbackInsight(payload) {
  const attendanceDeltaPct = (Number(payload.metrics?.deltas?.attendanceRate || 0) * 100).toFixed(1);
  const completionDeltaPct = (Number(payload.metrics?.deltas?.taskCompletionRate || 0) * 100).toFixed(1);
  const velocityDeltaPct = (Number(payload.metrics?.deltas?.taskVelocityPerWeek || 0) * 100).toFixed(1);

  const score = Number(payload.performance?.score || 0);
  const risk = Number(payload.performance?.risk_score || 0);
  const attendance = Number(payload.metrics?.window?.attendanceRate || 0);
  const completion = Number(payload.metrics?.window?.taskCompletionRate || 0);
  const nonExcusedLeaves = Number(payload.metrics?.window?.nonExcusedLeaveDays || 0);

  const trajectory =
    score >= 75
      ? "improving"
      : score >= 50
        ? "stable"
        : "declining";

  const burnoutRisk =
    risk >= 70 || (Number(velocityDeltaPct) < -25 && Number(attendanceDeltaPct) < -10)
      ? "High"
      : risk >= 40 || Number(velocityDeltaPct) < -10
        ? "Medium"
        : "Low";

  const issues = [];
  if (attendance < 0.75) issues.push("Attendance consistency is below target in the current 30-day window.");
  if (completion < 0.6) issues.push("Task completion throughput is lower than expected.");
  if (Number(velocityDeltaPct) < -15) issues.push("Task velocity is trending downward versus the 90-day baseline.");
  if (nonExcusedLeaves > 2) issues.push("Non-excused leave usage is elevated this month.");
  if (issues.length === 0) issues.push("No critical risk signals detected across attendance and delivery metrics.");

  return {
    summary: `Current performance score is ${score} with ${payload.performance?.risk_level} risk. The employee trajectory appears ${trajectory} across recent attendance and execution trends.`,
    trend_analysis: `30-day vs baseline: attendance ${attendanceDeltaPct}%, completion ${completionDeltaPct}%, and task velocity ${velocityDeltaPct}%. Overall trajectory is ${trajectory}.`,
    burnout_risk_indicator: burnoutRisk,
    issues,
    impact:
      burnoutRisk === "High"
        ? "Sustained decline may affect delivery reliability and team capacity planning if not addressed in the next cycle."
        : "Current trend has manageable operational impact with targeted manager intervention.",
    recommendations: [
      "Manager: review weekly delivery blockers and align sprint scope with current throughput.",
      "HR: monitor attendance variability and provide support pathways where recurring patterns appear.",
      "Manager: set measurable 2-week goals for completion rate and follow up in a structured check-in.",
    ],
    manager_action_items: [
      "Schedule a 20-minute 1:1 within 7 days to review workload, blockers, and support needs.",
      "Rebalance next sprint assignments to match recent task velocity and completion trends.",
      "Set a 2-week follow-up checkpoint with clear targets for attendance consistency and task completion.",
    ],
  };
}

export function computeAnalyticsPeriods({ now = new Date(), windowDays = 30, baselineDays = 90 } = {}) {
  const end = startOfDayUtc(now);
  const windowEnd = end;
  const windowStart = addDaysUtc(windowEnd, -(windowDays - 1));

  const baselineEnd = addDaysUtc(windowStart, -1);
  const baselineStart = addDaysUtc(baselineEnd, -(baselineDays - 1));

  return {
    windowDays,
    baselineDays,
    windowStart,
    windowEnd,
    baselineStart,
    baselineEnd,
  };
}

export async function buildEmployeeAnalyticsPayload(employee, periods) {
  const {
    windowStart,
    windowEnd,
    baselineStart,
    baselineEnd,
  } = periods;

  const windowDates = enumerateDatesUtc(windowStart, windowEnd);
  const baselineDates = enumerateDatesUtc(baselineStart, baselineEnd);

  const [attendanceWindow, attendanceBaseline] = await Promise.all([
    getAttendanceMap(employee._id, toYmdUtc(windowStart), toYmdUtc(windowEnd)),
    getAttendanceMap(employee._id, toYmdUtc(baselineStart), toYmdUtc(baselineEnd)),
  ]);

  const [leavesWindow, leavesBaseline] = await Promise.all([
    getApprovedLeaves(employee._id, windowStart, windowEnd),
    getApprovedLeaves(employee._id, baselineStart, baselineEnd),
  ]);

  // One fetch for tasks up to window end, we’ll reuse with time filters.
  const tasks = await getTasksForPeriod(employee._id, baselineStart, windowEnd);

  const windowComputed = computePeriodMetrics({
    datesUtc: windowDates,
    attendanceMap: attendanceWindow,
    approvedLeaves: leavesWindow,
    tasks,
    windowStart,
    windowEnd,
  });

  const baselineComputed = computePeriodMetrics({
    datesUtc: baselineDates,
    attendanceMap: attendanceBaseline,
    approvedLeaves: leavesBaseline,
    tasks,
    windowStart: baselineStart,
    windowEnd: baselineEnd,
  });

  const deltas = {
    attendanceRate: safeDeltaPercent(windowComputed.metrics.attendanceRate, baselineComputed.metrics.attendanceRate),
    taskCompletionRate: safeDeltaPercent(windowComputed.metrics.taskCompletionRate, baselineComputed.metrics.taskCompletionRate),
    taskVelocityPerWeek: safeDeltaPercent(windowComputed.metrics.taskVelocityPerWeek, baselineComputed.metrics.taskVelocityPerWeek),
  };

  const { performanceScore, riskScore, riskLevel } = computePerformanceAndRisk({
    window: windowComputed.metrics,
    baseline: baselineComputed.metrics,
    deltas,
  });

  return {
    employee: {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId || "",
      department: employee.department || "",
      jobTitle: employee.jobTitle || "",
    },
    period: {
      windowDays: periods.windowDays,
      baselineDays: periods.baselineDays,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      baselineStart: baselineStart.toISOString(),
      baselineEnd: baselineEnd.toISOString(),
    },
    metrics: {
      window: windowComputed.metrics,
      baseline: baselineComputed.metrics,
      deltas,
      series: {
        attendanceDaily: windowComputed.series.attendanceDaily,
        excusedLeaveDaily: windowComputed.series.excusedLeaveDaily,
        taskWeeks: windowComputed.series.taskWeeks,
      },
    },
    performance: {
      score: performanceScore,
      risk_score: riskScore,
      risk_level: riskLevel,
    },
  };
}

export async function computeAndCacheInsights({
  now = new Date(),
  windowDays = 30,
  baselineDays = 90,
  batchSize = 10,
  ttlDays = 14,
} = {}) {
  const periods = computeAnalyticsPeriods({ now, windowDays, baselineDays });

  const employees = await User.find({ role: "employee" }).select(
    "name email employeeId department jobTitle role"
  );
  if (!employees || employees.length === 0) return { computed: 0 };

  const payloads = [];
  for (const emp of employees) {
    payloads.push(await buildEmployeeAnalyticsPayload(emp, periods));
  }

  const enrichedForAi = payloads.map((p) => ({
    name: p.employee.name,
    department: p.employee.department,
    jobTitle: p.employee.jobTitle,
    performance_score: p.performance.score,
    risk_score: p.performance.risk_score,
    risk_level: p.performance.risk_level,
    window: p.metrics.window,
    baseline: p.metrics.baseline,
    deltas: p.metrics.deltas,
    series: p.metrics.series,
  }));

  const allInsights = [];
  for (let i = 0; i < enrichedForAi.length; i += batchSize) {
    const batch = enrichedForAi.slice(i, i + batchSize);
    const batchInsights = await generateInsightsBatch(batch);
    if (Array.isArray(batchInsights)) allInsights.push(...batchInsights);
  }

  const insightsByName = new Map();
  for (const item of allInsights) {
    if (item?.name) insightsByName.set(item.name, item.insight);
  }

  const expiresAt = addDaysUtc(periods.windowEnd, ttlDays);

  let computed = 0;
  for (const p of payloads) {
    const insight = insightsByName.get(p.employee.name) || buildFallbackInsight(p);
    const doc = {
      employee: p.employee._id,
      periodStart: periods.windowStart,
      periodEnd: periods.windowEnd,
      windowDays: periods.windowDays,
      baselineDays: periods.baselineDays,
      promptVersion: "v2-sliding-window",
      performance: {
        score: p.performance.score,
        riskScore: p.performance.risk_score,
        riskLevel: p.performance.risk_level,
      },
      metrics: {
        window: p.metrics.window,
        baseline: p.metrics.baseline,
        deltas: p.metrics.deltas,
        series: p.metrics.series,
      },
      insight,
      computedAt: new Date(),
      expiresAt,
    };

    await AnalyticsInsight.updateOne(
      {
        employee: p.employee._id,
        periodStart: periods.windowStart,
        periodEnd: periods.windowEnd,
        promptVersion: "v2-sliding-window",
      },
      { $set: doc },
      { upsert: true }
    );
    computed += 1;
  }

  return {
    computed,
    period: periods,
  };
}

