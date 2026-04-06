import Payroll from "../models/Payroll.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { getMonthRange, toDateKey } from "../utils/date.js";
import {
  calculatePayroll,
  normalizeSalaryStructure,
  sanitizeMoney,
} from "../utils/payroll.js";

const getGroupedRecords = (records, key = "employee") => {
  const grouped = new Map();

  for (const record of records) {
    const recordKey = String(record[key]);
    if (!grouped.has(recordKey)) {
      grouped.set(recordKey, []);
    }
    grouped.get(recordKey).push(record);
  }

  return grouped;
};

const generatePayroll = async (req, res) => {
  try {
    const { month } = req.body;
    const { month: payrollMonth, start, end } = getMonthRange(month);

    const employees = await User.find({ role: "employee" }).select(
      "name email employeeId department jobTitle salaryStructure"
    );

    if (employees.length === 0) {
      return res.status(200).json({
        success: true,
        month: payrollMonth,
        generatedCount: 0,
        totalNetPayout: 0,
        payrolls: [],
      });
    }

    const employeeIds = employees.map((employee) => employee._id);
    const attendanceRecords = await Attendance.find({
      employee: { $in: employeeIds },
      date: {
        $gte: toDateKey(start),
        $lte: toDateKey(end),
      },
    });
    const leaveRecords = await Leave.find({
      employee: { $in: employeeIds },
      status: "Approved",
      fromDate: { $lte: end },
      toDate: { $gte: start },
    });

    const attendanceByEmployee = getGroupedRecords(attendanceRecords);
    const leaveByEmployee = getGroupedRecords(leaveRecords);

    const payrolls = await Promise.all(
      employees.map(async (employee) => {
        const payrollPayload = calculatePayroll({
          employee,
          month: payrollMonth,
          attendanceRecords:
            attendanceByEmployee.get(String(employee._id)) || [],
          leaveRecords: leaveByEmployee.get(String(employee._id)) || [],
        });

        return Payroll.findOneAndUpdate(
          {
            employee: employee._id,
            month: payrollMonth,
          },
          {
            employee: employee._id,
            ...payrollPayload,
            generatedBy: req.user._id,
            generatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      })
    );

    const totalNetPayout = sanitizeMoney(
      payrolls.reduce(
        (sum, payroll) => sum + (payroll.breakdown?.netSalary || 0),
        0
      )
    );

    return res.status(200).json({
      success: true,
      month: payrollMonth,
      generatedCount: payrolls.length,
      totalNetPayout,
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate payroll",
    });
  }
};

const getPayrolls = async (req, res) => {
  try {
    const filter = {};

    if (req.query.month) {
      filter.month = getMonthRange(req.query.month).month;
    }

    const payrolls = await Payroll.find(filter).sort({
      month: -1,
      "employeeSnapshot.name": 1,
    });

    return res.status(200).json({
      success: true,
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch payroll records",
    });
  }
};

const getMyPayrolls = async (req, res) => {
  try {
    const filter = { employee: req.user._id };

    if (req.query.month) {
      filter.month = getMonthRange(req.query.month).month;
    }

    const payrolls = await Payroll.find(filter).sort({ month: -1 });

    return res.status(200).json({
      success: true,
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch payroll records",
    });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res
        .status(404)
        .json({ success: false, error: "Payroll record not found" });
    }

    const isOwner = String(payroll.employee) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, error: "Access denied" });
    }

    return res.status(200).json({
      success: true,
      payroll,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch payroll record",
    });
  }
};

const updateSalaryStructure = async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.employeeId,
      role: "employee",
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found" });
    }

    employee.salaryStructure = normalizeSalaryStructure(req.body);
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Salary structure updated successfully.",
      salaryStructure: employee.salaryStructure,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to update salary structure",
    });
  }
};

export {
  generatePayroll,
  getPayrollById,
  getPayrolls,
  getMyPayrolls,
  updateSalaryStructure,
};
