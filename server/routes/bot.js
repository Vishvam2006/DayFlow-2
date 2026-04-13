import express from "express";
import {
  applyLeaveFromBot,
  completeTaskFromBot,
  getAssignedTasksFromBot,
  getAllEmployeePhones,
  verifyEmployee,
} from "../controller/botController.js";
import botSecretMiddleware from "../middleware/botSecretMiddleware.js";

const router = express.Router();

router.use(botSecretMiddleware);

router.post("/verify-employee", verifyEmployee);
router.post("/leaves/apply", applyLeaveFromBot);
router.get("/tasks", getAssignedTasksFromBot);
router.patch("/tasks/:taskId/complete", completeTaskFromBot);
router.get("/employees", getAllEmployeePhones);

export default router;
