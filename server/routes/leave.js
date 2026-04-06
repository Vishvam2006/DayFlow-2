import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  allLeaveRequests,
  applyLeave,
  showLeave,
  updateLeaveStatus,
  getMyPendingLeaves
} from "../controller/leaveController.js";

const router = express.Router();

router.post("/apply", authMiddleware, applyLeave);
router.get("/showLeave", authMiddleware, showLeave);
router.get("/leave-requests", authMiddleware, adminMiddleware, allLeaveRequests);
router.put("/update-status/:id", authMiddleware, adminMiddleware, updateLeaveStatus);
router.get("/my-leaves", authMiddleware, getMyPendingLeaves);

export default router;
