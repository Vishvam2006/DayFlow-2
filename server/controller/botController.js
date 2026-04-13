import User, { E164_PHONE_NUMBER_REGEX } from "../models/User.js";
import Task from "../models/Task.js";
import { createLeaveRequest } from "../services/leaveService.js";
import mongoose from "mongoose";

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
      employeeId,
      fromDate,
      toDate,
      reason,
      leaveType = "Casual",
    } = req.body;

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

export {
  verifyEmployee,
  applyLeaveFromBot,
  getAssignedTasksFromBot,
  completeTaskFromBot,
  getAllEmployeePhones,
};
