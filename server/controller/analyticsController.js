import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Task from "../models/Task.js";
import { generateInsightsBatch } from "../services/groqService.js";

export const getAnalytics = async (req, res) => {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(200).json([]);
    }

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const attendanceRecords = await Attendance.find({ user: u._id });
        const presentDays = attendanceRecords.filter(a => a.status === "present").length;
        const attendanceScore = attendanceRecords.length ? presentDays / attendanceRecords.length : 0;

        const leaves = await Leave.find({ user: u._id });
        const leaveRatio = attendanceRecords.length ? leaves.length / attendanceRecords.length : 0;

        const tasks = await Task.find({ assignedTo: u._id });
        const completed = tasks.filter(t => t.status === "completed").length;
        const productivity = tasks.length ? completed / tasks.length : 0;

        const riskScore =
          (1 - productivity) * 40 +
          leaveRatio * 30 +
          (1 - attendanceScore) * 30;

        return {
          name: u.name,
          productivity,
          leave_ratio: leaveRatio,
          attendance_score: attendanceScore,
          risk_score: Math.round(riskScore),
        };
      })
    );

    const insightsRaw = await generateInsightsBatch(enrichedUsers);
    const insights = Array.isArray(insightsRaw) ? insightsRaw.filter(Boolean) : [];

    const finalData = enrichedUsers.map((user) => {
      const insightObj = insights.find((i) => i?.name === user.name);

      let risk_level = "Low";
      if (user.risk_score >= 70) risk_level = "High";
      else if (user.risk_score >= 40) risk_level = "Medium";

      return {
        ...user,
        risk_level,
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