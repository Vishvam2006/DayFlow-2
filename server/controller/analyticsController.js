import User from "../models/User.js";
import Task from "../models/Task.js";
import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";

import { calculateMetrics, calculateRisk } from "../utils/analytics.js";
import { generateInsightsBatch } from "../services/geminiService.js";

export const getAnalytics = async (req, res) => {
  try {
    // 1. Fetch all employees
    const users = await User.find({ role: "employee" }).select("name email _id").lean();

    if (users.length === 0) {
      return res.json([]);
    }

    const userIds = users.map(u => u._id);

    // 2. Batch-fetch all related data (no per-employee queries)
    const [allTasks, allLeaves, allAttendance] = await Promise.all([
      Task.find({ assignedTo: { $in: userIds } }).lean(),
      Leave.find({ employee: { $in: userIds } }).lean(),
      Attendance.find({ employee: { $in: userIds } }).lean(),
    ]);

    // 3. Index data by employee ID for O(1) lookup
    const tasksByEmp = {};
    const leavesByEmp = {};
    const attendanceByEmp = {};

    for (const t of allTasks) {
      const id = t.assignedTo.toString();
      if (!tasksByEmp[id]) tasksByEmp[id] = [];
      tasksByEmp[id].push(t);
    }

    for (const l of allLeaves) {
      const id = l.employee.toString();
      if (!leavesByEmp[id]) leavesByEmp[id] = [];
      leavesByEmp[id].push(l);
    }

    for (const a of allAttendance) {
      const id = a.employee.toString();
      if (!attendanceByEmp[id]) attendanceByEmp[id] = [];
      attendanceByEmp[id].push(a);
    }

    // 4. Compute metrics + risk for each employee
    const result = users.map(user => {
      const id = user._id.toString();
      const tasks = tasksByEmp[id] || [];
      const leaves = leavesByEmp[id] || [];
      const attendance = attendanceByEmp[id] || [];

      const empData = {
        name: user.name,
        assignedTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === "completed").length,
        leavesTaken: leaves.length,
        workingDays: 30,
        presentDays: attendance.filter(a => a.status === "present").length,
        totalDays: attendance.length > 0 ? attendance.length : 30,
      };

      const metrics = calculateMetrics(empData);
      const { score, level } = calculateRisk({
        ...metrics,
        tasks_assigned: empData.assignedTasks,
      });

      return {
        name: user.name,
        ...metrics,
        risk_score: score,
        risk_level: level,
      };
    });

    // 5. Generate Gemini insights (batch — single API call)
    const insights = await generateInsightsBatch(result);

    // 6. Merge insights into final response
    const finalData = result.map(emp => {
      const match = insights.find(i => i.name === emp.name);
      return {
        ...emp,
        // Round metrics to 2 decimal places for cleaner JSON
        productivity: Math.round(emp.productivity * 100) / 100,
        leave_ratio: Math.round(emp.leave_ratio * 100) / 100,
        attendance_score: Math.round(emp.attendance_score * 100) / 100,
        insight: match?.insight || "No insight available",
      };
    });

    // 7. Sort by risk_score descending (highest risk first)
    finalData.sort((a, b) => b.risk_score - a.risk_score);

    res.json(finalData);

  } catch (err) {
    console.error("[AnalyticsController] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};