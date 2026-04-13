import express from "express";
import {
  getAnalytics,
  getEmployeeAnalytics,
  recomputeAnalyticsNow,
} from "../controller/analyticsController.js";

const router = express.Router();

router.get("/", getAnalytics);
router.get("/employee/:employeeId", getEmployeeAnalytics);
router.post("/recompute", recomputeAnalyticsNow);

export default router;