import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Task from "../models/Task.js";
import { generateInsightsBatch } from "../services/groqService.js";

const clampRatio = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number, 0), 1);
};

const safeDivide = (numerator, denominator) => {
  const top = Number(numerator);
  const bottom = Number(denominator);
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= 0) return 0;
  return clampRatio(top / bottom);
};

const getInclusiveDayCount = (fromDate, toDate) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return 0;
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  return Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;
};

const getAttendanceValue = (status) => {
  if (status === "Present") return 1;
  if (status === "Half Day") return 0.5;
  return 0;
};

const getRiskLevel = (riskScore) => {
  if (riskScore >= 70) return "High";
  if (riskScore >= 40) return "Medium";
  return "Low";
};

export const getAnalytics = async (req, res) => {
  try {
    const users = await User.find({ role: "employee" }).select(
      "name email employeeId department jobTitle role",
    );

    if (!users || users.length === 0) {
      return res.status(200).json([]);
    }

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const attendanceRecords = await Attendance.find({ employee: u._id });
        const attendedDays = attendanceRecords.reduce(
          (total, record) => total + getAttendanceValue(record.status),
          0,
        );
        const attendanceScore = safeDivide(attendedDays, attendanceRecords.length);

        const approvedLeaves = await Leave.find({ employee: u._id, status: "Approved" });
        const approvedLeaveDays = approvedLeaves.reduce(
          (total, leave) => total + getInclusiveDayCount(leave.fromDate, leave.toDate),
          0,
        );
        const trackedDays = attendanceRecords.length + approvedLeaveDays;
        const leaveRatio = safeDivide(approvedLeaveDays, trackedDays);

        const tasks = await Task.find({ assignedTo: u._id });
        const completed = tasks.filter((t) => t.status === "Completed").length;
        const productivity = safeDivide(completed, tasks.length);

        const riskScore =
          (1 - productivity) * 40 +
          leaveRatio * 30 +
          (1 - attendanceScore) * 30;

        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          employeeId: u.employeeId || "",
          department: u.department || "",
          jobTitle: u.jobTitle || "",
          productivity,
          leave_ratio: leaveRatio,
          attendance_score: attendanceScore,
          risk_score: Math.round(Math.min(Math.max(riskScore, 0), 100)),
          metrics: {
            attendance_records: attendanceRecords.length,
            attended_days: attendedDays,
            approved_leave_days: approvedLeaveDays,
            tasks_assigned: tasks.length,
            tasks_completed: completed,
          },
        };
      })
    );

    const insightsRaw = await generateInsightsBatch(enrichedUsers);
    const insights = Array.isArray(insightsRaw) ? insightsRaw.filter(Boolean) : [];

    const finalData = enrichedUsers.map((user) => {
      const insightObj = insights.find((i) => i?.name === user.name);

      return {
        ...user,
        risk_level: getRiskLevel(user.risk_score),
        insight: insightObj?.insight || {
          summary: "Analysis pending",
          issues: [],
          impact: "N/A",
          recommendations: [],
        },
      };
    });

    return res.status(200).json(finalData);
  } catch (err) {
    console.error("[AnalyticsController] Error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
