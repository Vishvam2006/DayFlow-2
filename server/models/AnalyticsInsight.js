import mongoose from "mongoose";

const analyticsInsightSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    windowDays: { type: Number, required: true, default: 30 },
    baselineDays: { type: Number, required: true, default: 90 },

    modelProvider: { type: String, default: "groq" },
    modelName: { type: String, default: "llama-3.1-8b-instant" },
    promptVersion: { type: String, default: "v1" },

    performance: {
      score: { type: Number, required: true, min: 0, max: 100 },
      riskScore: { type: Number, required: true, min: 0, max: 100 },
      riskLevel: { type: String, enum: ["Low", "Medium", "High"], required: true },
    },

    metrics: {
      window: { type: mongoose.Schema.Types.Mixed, default: {} },
      baseline: { type: mongoose.Schema.Types.Mixed, default: {} },
      deltas: { type: mongoose.Schema.Types.Mixed, default: {} },
      series: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    insight: {
      summary: { type: String, default: "Analysis pending" },
      trend_analysis: { type: String, default: "N/A" },
      burnout_risk_indicator: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Low",
      },
      issues: { type: [String], default: [] },
      impact: { type: String, default: "N/A" },
      recommendations: { type: [String], default: [] },
      manager_action_items: { type: [String], default: [] },
    },

    computedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

analyticsInsightSchema.index(
  { employee: 1, periodStart: 1, periodEnd: 1, promptVersion: 1 },
  { unique: true }
);

// TTL cleanup of old cached analytics
analyticsInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AnalyticsInsight = mongoose.model("AnalyticsInsight", analyticsInsightSchema);

export default AnalyticsInsight;

