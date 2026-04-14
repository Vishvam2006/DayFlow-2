import mongoose from "mongoose";
import net from "net";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // store YYYY-MM-DD
      required: true,
    },

    checkIn: {
      type: Date,
    },

    deviceIP: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator(value) {
          if (!value) return true;
          return Boolean(net.isIP(String(value).trim()));
        },
        message: "deviceIP must be a valid IP address",
      },
    },

    verificationStatus: {
      type: String,
      enum: ["Verified", "Flagged", "Rejected"],
      default: "Verified",
    },

    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },

    flagReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },

    networkName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 80,
    },

    checkOut: {
      type: Date,
    },

    workHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Present", "Half Day", "Absent"],
      default: "Absent",
    },

    arrivalStatus: {
      type: String,
      enum: ["On Time", "Late", "Unknown"],
      default: "Unknown",
    },
  },
  { timestamps: true, strict: "throw" }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ deviceIP: 1 });
attendanceSchema.index({ verificationStatus: 1, date: 1 });
attendanceSchema.index({ isFlagged: 1, date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
