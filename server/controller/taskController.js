import Task from "../models/Task.js";

// Admin: Create a new task and assign to an employee
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      dueDate,
    });
    await task.save();
    const populated = await task.populate("assignedTo", "name email");
    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error creating task" });
  }
};

// Admin: Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
};

// Employee: Get my assigned tasks
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching tasks" });
  }
};

// Employee: Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("assignedTo", "name email");
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating task" });
  }
};

// Admin: Delete a task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await Task.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting task" });
  }
};

export { createTask, getAllTasks, getMyTasks, updateTaskStatus, deleteTask };
