import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",        // or "Employee" depending on your auth model
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["Casual", "Sick", "Paid", "Unpaid"],
      required: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    decisionComment: {
      type: String,
      default: "",
      trim: true,
    },

    notification: {
      lastStatusNotified: {
        type: String,
        enum: ["Approved", "Rejected", null],
        default: null,
      },
      lastAttemptedStatus: {
        type: String,
        enum: ["Approved", "Rejected", null],
        default: null,
      },
      lastNotifiedAt: {
        type: Date,
        default: null,
      },
      lastAttemptedAt: {
        type: Date,
        default: null,
      },
      lastError: {
        type: String,
        default: "",
      },
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
