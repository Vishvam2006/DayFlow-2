import mongoose from "mongoose";

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

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
          return IPV4_REGEX.test(value);
        },
        message: "deviceIP must be a valid IPv4 address",
      },
    },

    verificationStatus: {
      type: String,
      enum: ["Verified", "Rejected"],
      default: "Verified",
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
  },
  { timestamps: true, strict: "throw" }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ deviceIP: 1 });
attendanceSchema.index({ verificationStatus: 1, date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;