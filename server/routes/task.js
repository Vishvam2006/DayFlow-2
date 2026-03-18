import express from "express";
import verifyUser from "../middleware/authMiddleware.js";
import {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  deleteTask,
} from "../controller/taskController.js";

const router = express.Router();

// Admin routes
router.post("/", verifyUser, createTask);
router.get("/all", verifyUser, getAllTasks);
router.delete("/:id", verifyUser, deleteTask);

// Employee routes
router.get("/my-tasks", verifyUser, getMyTasks);
router.put("/:id/status", verifyUser, updateTaskStatus);

export default router;
