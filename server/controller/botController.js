import User, { E164_PHONE_NUMBER_REGEX } from "../models/User.js";
import Task from "../models/Task.js";
import { createLeaveRequest } from "../services/leaveService.js";
import {
  claimPendingLeaveNotifications,
  markLeaveNotificationDelivered,
  markLeaveNotificationFailed,
} from "../services/leaveNotificationService.js";
import {
  checkInEmployee,
  checkOutEmployee,
  getMonthlyAttendanceSummaryForEmployee,
  getTodayAttendanceForEmployee,
  serializeAttendanceRecord,
} from "../services/attendanceService.js";
import mongoose from "mongoose";

const normalizeEmployeeCode = (value) =>
  typeof value === "string" ? value.trim() : "";

const verifyEmployee = async (req, res) => {
  try {
    const phoneNumber =
      typeof req.body.phoneNumber === "string" ? req.body.phoneNumber.trim() : "";

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "phoneNumber is required.",
      });
    }

    if (!E164_PHONE_NUMBER_REGEX.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "phoneNumber must be in E.164 format (e.g., +91XXXXXXXXXX).",
      });
    }

    const employee = await User.findOne({ role: "employee", phoneNumber }).select(
      "_id name email phoneNumber employeeId role department jobTitle",
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: "No employee found for this phone number.",
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      employee: {
        id: employee._id,
        empId: employee.employeeId,
        employeeId: employee.employeeId,
        role: employee.role,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        department: employee.department,
        jobTitle: employee.jobTitle,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      verified: false,
      error: error.message,
    });
  }
};

const applyLeaveFromBot = async (req, res) => {
  try {
    const {
      employeeId: rawEmployeeId,
      empId: rawEmpId,
      fromDate,
      toDate,
      reason,
      leaveType = "Casual",
    } = req.body;
    const employeeId = normalizeEmployeeCode(rawEmpId || rawEmployeeId);

    if (!employeeId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        error: "employeeId, fromDate, toDate, and reason are required.",
      });
    }

    const employee = await User.findOne({ employeeId }).select(
      "_id name email employeeId role",
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    if (employee.role !== "employee") {
      return res.status(403).json({
        success: false,
        error: "Only employees can apply for leave.",
      });
    }

    const leave = await createLeaveRequest({
      employeeId: employee._id,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    const populatedLeave = await leave.populate(
      "employee",
      "name email employeeId department",
    );

    return res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave: populatedLeave,
      employee: {
        id: employee._id,
        empId: employee.employeeId,
        employeeId: employee.employeeId,
        name: employee.name,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : "Apply leave server error",
    });
  }
};

const findEmployeeByEmployeeId = async (employeeId) =>
  User.findOne({ employeeId, role: "employee" }).select(
    "_id name email employeeId role",
  );

const getAssignedTasksFromBot = async (req, res) => {
  try {
    const employeeId =
      typeof req.query.employeeId === "string" ? req.query.employeeId.trim() : "";

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required.",
      });
    }

    const employee = await findEmployeeByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    const tasks = await Task.find({ assignedTo: employee._id })
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error fetching tasks.",
    });
  }
};

const completeTaskFromBot = async (req, res) => {
  try {
    const { taskId } = req.params;
    const employeeId =
      typeof req.body.employeeId === "string" ? req.body.employeeId.trim() : "";

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required.",
      });
    }

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID.",
      });
    }

    const employee = await findEmployeeByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found.",
      });
    }

    if (String(task.assignedTo) !== String(employee._id)) {
      return res.status(403).json({
        success: false,
        error: "You can only update tasks assigned to you.",
      });
    }

    task.status = "Completed";
    await task.save();

    const populatedTask = await task.populate("assignedTo", "name email employeeId");

    return res.status(200).json({
      success: true,
      message: "Task marked as completed.",
      task: populatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error updating task.",
    });
  }
};

const getAllEmployeePhones = async (req, res) => {
  try {
    const employees = await User.find({ 
      role: "employee", 
      phoneNumber: { $exists: true, $ne: "" } 
    }).select("phoneNumber").lean();
    
    return res.status(200).json({
      success: true,
      employees: employees
        .filter(e => e.phoneNumber)
        .map((e) => ({ phoneNumber: e.phoneNumber })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const claimLeaveNotifications = async (req, res) => {
  try {
    const limit =
      typeof req.body.limit === "number" || typeof req.body.limit === "string"
        ? req.body.limit
        : 10;

    const notifications = await claimPendingLeaveNotifications(limit);

    return res.status(200).json({
      success: true,
      notifications: notifications.map((leave) => ({
        leaveId: leave._id,
        status: leave.status,
        leaveType: leave.leaveType,
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        reason: leave.reason || "",
        decisionComment: leave.decisionComment || "",
        employee: leave.employee
          ? {
              id: leave.employee._id,
              name: leave.employee.name,
              email: leave.employee.email,
              empId: leave.employee.employeeId,
              employeeId: leave.employee.employeeId,
              phoneNumber: leave.employee.phoneNumber,
              department: leave.employee.department,
            }
          : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to claim leave notifications.",
    });
  }
};

const acknowledgeLeaveNotification = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const status =
      typeof req.body.status === "string" ? req.body.status.trim() : "";

    if (!mongoose.isValidObjectId(leaveId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid leave ID.",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status.",
      });
    }

    const leave = await markLeaveNotificationDelivered({ leaveId, status });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave notification target not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave notification acknowledged.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to acknowledge leave notification.",
    });
  }
};

const failLeaveNotification = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const status =
      typeof req.body.status === "string" ? req.body.status.trim() : "";
    const errorMessage =
      typeof req.body.error === "string" ? req.body.error.trim() : "Notification delivery failed.";

    if (!mongoose.isValidObjectId(leaveId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid leave ID.",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status.",
      });
    }

    const leave = await markLeaveNotificationFailed({
      leaveId,
      status,
      errorMessage,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: "Leave notification target not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave notification failure recorded.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to record leave notification failure.",
    });
  }
};

const getAttendanceStatusFromBot = async (req, res) => {
  try {
    const employeeId =
      typeof req.query.employeeId === "string" ? req.query.employeeId.trim() : "";

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required.",
      });
    }

    const employee = await findEmployeeByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    const attendance = await getTodayAttendanceForEmployee({ employeeId: employee._id });

    return res.status(200).json({
      success: true,
      employee: {
        id: employee._id,
        empId: employee.employeeId,
        employeeId: employee.employeeId,
        name: employee.name,
      },
      attendance: serializeAttendanceRecord(attendance),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Error fetching attendance status.",
    });
  }
};

const checkInFromBot = async (req, res) => {
  try {
    const employeeId = normalizeEmployeeCode(req.body.empId || req.body.employeeId);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required.",
      });
    }

    const employee = await findEmployeeByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    const { attendance, isFlagged, networkVerification } = await checkInEmployee({
      employeeId: employee._id,
      deviceIP: "",
    });

    return res.status(200).json({
      success: true,
      message: isFlagged
        ? "Attendance marked, but the source could not be verified and was flagged."
        : "Checked in successfully.",
      employee: {
        id: employee._id,
        empId: employee.employeeId,
        employeeId: employee.employeeId,
        name: employee.name,
      },
      attendance: serializeAttendanceRecord(attendance),
      isFlagged,
      networkVerification,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Attendance check-in failed.",
      code: error.code,
      attendance: error.attendance ? serializeAttendanceRecord(error.attendance) : null,
    });
  }
};

const checkOutFromBot = async (req, res) => {
  try {
    const employeeId = normalizeEmployeeCode(req.body.empId || req.body.employeeId);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required.",
      });
    }

    const employee = await findEmployeeByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    const { attendance, workHours } = await checkOutEmployee({
      employeeId: employee._id,
    });

    return res.status(200).json({
      success: true,
      message: "Checked out successfully.",
      employee: {
        id: employee._id,
        empId: employee.employeeId,
        employeeId: employee.employeeId,
        name: employee.name,
      },
      attendance: serializeAttendanceRecord(attendance),
      workHours,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Attendance check-out failed.",
      code: error.code,
      attendance: error.attendance ? serializeAttendanceRecord(error.attendance) : null,
    });
  }
};

const getMonthlyAttendanceSummaryFromBot = async (req, res) => {
  try {
    const employeeId =
      typeof req.query.employeeId === "string" ? req.query.employeeId.trim() : "";
    const month =
      typeof req.query.month === "string" && req.query.month.trim()
        ? req.query.month.trim()
        : undefined;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required.",
      });
    }

    const employee = await findEmployeeByEmployeeId(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    const result = await getMonthlyAttendanceSummaryForEmployee({
      employeeId: employee._id,
      month,
    });

    return res.status(200).json({
      success: true,
      employee: {
        id: employee._id,
        empId: employee.employeeId,
        employeeId: employee.employeeId,
        name: employee.name,
      },
      month: result.month,
      summary: result.summary,
      records: result.records.map((record) => serializeAttendanceRecord(record)),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Error fetching monthly attendance summary.",
    });
  }
};

export {
  verifyEmployee,
  applyLeaveFromBot,
  getAssignedTasksFromBot,
  completeTaskFromBot,
  getAllEmployeePhones,
  claimLeaveNotifications,
  acknowledgeLeaveNotification,
  failLeaveNotification,
  getAttendanceStatusFromBot,
  checkInFromBot,
  checkOutFromBot,
  getMonthlyAttendanceSummaryFromBot,
};
