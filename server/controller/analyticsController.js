import AnalyticsInsight from "../models/AnalyticsInsight.js";
import {
  computeAnalyticsPeriods,
  computeAndCacheInsights,
} from "../services/analyticsInsightsService.js";
import User from "../models/User.js";

const defaultInsight = {
  summary: "Analysis pending",
  trend_analysis: "N/A",
  burnout_risk_indicator: "Low",
  issues: [],
  impact: "N/A",
  recommendations: [],
  manager_action_items: [],
};

function mapDocToResponse(d) {
  return {
    _id: d.employee?._id || d.employee,
    name: d.employee?.name || "",
    email: d.employee?.email || "",
    employeeId: d.employee?.employeeId || "",
    department: d.employee?.department || "",
    jobTitle: d.employee?.jobTitle || "",
    performance_score: d.performance?.score ?? 0,
    risk_score: d.performance?.riskScore ?? 0,
    risk_level: d.performance?.riskLevel || "Low",
    metrics: d.metrics || {},
    insight: { ...defaultInsight, ...(d.insight || {}) },
    period: {
      windowDays: d.windowDays,
      baselineDays: d.baselineDays,
      periodStart: d.periodStart,
      periodEnd: d.periodEnd,
      computedAt: d.computedAt,
      expiresAt: d.expiresAt,
    },
  };
}

export const getAnalytics = async (req, res) => {
  try {
    const windowDays = Number(req.query.windowDays || 30);
    const baselineDays = Number(req.query.baselineDays || 90);

    // 🚀 Trigger async (DON'T WAIT)
    computeAndCacheInsights({
      now: new Date(),
      windowDays,
      baselineDays,
    }).catch(console.error);

    // ⚡ Return existing data immediately
    const docs = await AnalyticsInsight.find({
      windowDays,
      baselineDays,
      promptVersion: "v1",
    }).populate("employee");

    return res.json(docs.map(mapDocToResponse));

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

export const getEmployeeAnalytics = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const now = new Date();
    const windowDays = Number(req.query.windowDays || 30);
    const baselineDays = Number(req.query.baselineDays || 90);

    const periods = computeAnalyticsPeriods({ now, windowDays, baselineDays });

    let doc = await AnalyticsInsight.findOne({
      employee: employeeId,
      periodStart: periods.windowStart,
      periodEnd: periods.windowEnd,
      windowDays: periods.windowDays,
      baselineDays: periods.baselineDays,
      promptVersion: "v1",
    })
      .populate("employee", "name email employeeId department jobTitle")
      .lean();

    if (!doc) {
      doc = await AnalyticsInsight.findOne({
        employee: employeeId,
        windowDays: periods.windowDays,
        baselineDays: periods.baselineDays,
        promptVersion: "v1",
      })
        .sort({ periodEnd: -1 })
        .populate("employee", "name email employeeId department jobTitle")
        .lean();
    }

    if (doc) return res.status(200).json(mapDocToResponse(doc));

    const user = await User.findById(employeeId).select(
      "name email employeeId department jobTitle role",
    );
    if (!user) return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId || "",
      department: user.department || "",
      jobTitle: user.jobTitle || "",
      performance_score: 0,
      risk_score: 0,
      risk_level: "Low",
      metrics: {},
      insight: defaultInsight,
      period: {
        windowDays: periods.windowDays,
        baselineDays: periods.baselineDays,
        periodStart: periods.windowStart,
        periodEnd: periods.windowEnd,
        computedAt: null,
        expiresAt: null,
      },
    });
  } catch (err) {
    console.error("[AnalyticsController] Error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

export const recomputeAnalyticsNow = async (req, res) => {
  try {
    const windowDays = Number(req.body?.windowDays || 30);
    const baselineDays = Number(req.body?.baselineDays || 90);

    computeAndCacheInsights({
      now: new Date(),
      windowDays,
      baselineDays,
    }).catch((err) => {
      console.error(
        "[AnalyticsController] Recompute failed:",
        err?.message || err,
      );
    });

    return res.status(202).json({
      message: "Analytics recompute started.",
      windowDays,
      baselineDays,
    });
  } catch (err) {
    console.error("[AnalyticsController] Error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
