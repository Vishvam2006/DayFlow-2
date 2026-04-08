import express from "express";
import verifyUser from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  createTask,
  getAllTasks,
  getMyTasks,
  updateTaskStatus,
  deleteTask,
} from "../controller/taskController.js";

const router = express.Router();

// Admin routes
router.post("/", verifyUser, adminMiddleware, createTask);
router.get("/all", verifyUser, adminMiddleware, getAllTasks);
router.delete("/:id", verifyUser, adminMiddleware, deleteTask);

// Employee routes
router.get("/my-tasks", verifyUser, getMyTasks);
router.put("/:id/status", verifyUser, updateTaskStatus);

export default router;
