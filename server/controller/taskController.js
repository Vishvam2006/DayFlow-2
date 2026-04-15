import Task from "../models/Task.js";
import User from "../models/User.js";
import { buildPaginationMeta, escapeRegex, parsePagination } from "../utils/pagination.js";
import { queueEmail, sendTaskNotification } from "../services/email/emailService.js";

const ALLOWED_STATUSES = new Set(["Pending", "In Progress", "Completed"]);

function formatDueDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Admin: Create a new task and assign to an employee
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (!title || !assignedTo) {
      return res
        .status(400)
        .json({ success: false, message: "Title and assignedTo are required" });
    }

    const assignee = await User.findOne({ _id: assignedTo, role: "employee" })
      .select("_id name email")
      .lean();
    if (!assignee) {
      return res
        .status(404)
        .json({ success: false, message: "Assigned employee not found" });
    }

    const task = new Task({
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      assignedTo: assignee._id,
      assignedBy: req.user._id,
      priority,
      dueDate,
    });
    await task.save();
    const populated = await task.populate("assignedTo", "name email");

    queueEmail("task-assignment", () =>
      sendTaskNotification({
        email: assignee.email,
        employeeName: assignee.name,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: formatDueDate(task.dueDate),
        assignedByName: req.user?.name || "Your HR manager",
        dashboardUrl: process.env.EMPLOYEE_TASKS_URL || process.env.EMPLOYEE_DASHBOARD_URL || process.env.APP_URL || "",
      })
    );

    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating task" });
  }
};

// Admin: Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 10,
      maxLimit: 100,
    });
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const filter = status && status !== "All" ? { status } : {};
    const search = q
      ? {
          $or: [
            { title: { $regex: escapeRegex(q), $options: "i" } },
            { description: { $regex: escapeRegex(q), $options: "i" } },
          ],
        }
      : {};
    const query = { ...filter, ...search };

    const [tasks, totalItems] = await Promise.all([
      Task.find(query)
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query),
    ]);
    const pagination = buildPaginationMeta({ page, limit, totalItems });

    res.status(200).json({
      success: true,
      tasks,
      ...pagination,
      filters: {
        status: status || "All",
        q,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
};

// Employee: Get my assigned tasks
const getMyTasks = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 9,
      maxLimit: 100,
    });
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const filter = {
      assignedTo: req.user._id,
      ...(status && status !== "All" ? { status } : {}),
    };

    const [tasks, totalItems] = await Promise.all([
      Task.find(filter)
        .populate("assignedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);
    const pagination = buildPaginationMeta({ page, limit, totalItems });

    res.status(200).json({
      success: true,
      tasks,
      ...pagination,
      filters: {
        status: status || "All",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
};

// Employee: Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.has(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const isAssignee = String(task.assignedTo) === String(req.user._id);
    const isAdmin = req.user?.role === "admin";
    if (!isAssignee && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    task.status = status;
    await task.save();

    const populated = await task.populate("assignedTo", "name email");
    res.status(200).json({ success: true, task: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating task" });
  }
};

// Admin: Delete a task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting task" });
  }
};

export { createTask, getAllTasks, getMyTasks, updateTaskStatus, deleteTask };
