import express from "express";
import {
  acknowledgeLeaveNotification,
  applyLeaveFromBot,
  checkInFromBot,
  checkOutFromBot,
  claimLeaveNotifications,
  completeTaskFromBot,
  failLeaveNotification,
  getAttendanceStatusFromBot,
  getAssignedTasksFromBot,
  getAllEmployeePhones,
  getMonthlyAttendanceSummaryFromBot,
  verifyEmployee,
} from "../controller/botController.js";
import botSecretMiddleware from "../middleware/botSecretMiddleware.js";

const router = express.Router();

router.use(botSecretMiddleware);

router.post("/verify-employee", verifyEmployee);
router.post("/leaves/apply", applyLeaveFromBot);
router.post("/leave-notifications/claim", claimLeaveNotifications);
router.post("/leave-notifications/:leaveId/ack", acknowledgeLeaveNotification);
router.post("/leave-notifications/:leaveId/fail", failLeaveNotification);
router.post("/attendance/check-in", checkInFromBot);
router.post("/attendance/check-out", checkOutFromBot);
router.get("/attendance/today", getAttendanceStatusFromBot);
router.get("/attendance/monthly-summary", getMonthlyAttendanceSummaryFromBot);
router.get("/tasks", getAssignedTasksFromBot);
router.patch("/tasks/:taskId/complete", completeTaskFromBot);
router.get("/employees", getAllEmployeePhones);

export default router;
