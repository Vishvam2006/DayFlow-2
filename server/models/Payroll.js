import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    monthLabel: {
      type: String,
      required: true,
    },
    employeeSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      employeeId: { type: String, default: "" },
      department: { type: String, default: "" },
      jobTitle: { type: String, default: "" },
    },
    salaryStructure: {
      basicSalary: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      taxDeduction: { type: Number, default: 0 },
      pfDeduction: { type: Number, default: 0 },
    },
    attendanceSummary: {
      workingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      payableAttendanceDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      deductionDays: { type: Number, default: 0 },
    },
    breakdown: {
      perDayRate: { type: Number, default: 0 },
      grossSalary: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      leaveDeduction: { type: Number, default: 0 },
      taxDeduction: { type: Number, default: 0 },
      pfDeduction: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      netSalary: { type: Number, default: 0 },
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
