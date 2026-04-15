import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { attachClientIp } from "../middleware/clientIpMiddleware.js";
import {
    checkIn,
    checkOut,
    getAttendance,
    getAttendanceLogs,
    getFlaggedAttendance,
    getYearAttendance,
    verifyClockInNetwork,
} from "../controller/attendanceController.js";

const router = express.Router();

router.post("/check-in", authMiddleware, attachClientIp, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/today", authMiddleware, getAttendance);
router.get("/logs", authMiddleware, getAttendanceLogs);
router.get("/year", authMiddleware, getYearAttendance);
router.get("/network-status", authMiddleware, attachClientIp, verifyClockInNetwork);
router.get("/flagged", authMiddleware, adminMiddleware, getFlaggedAttendance);


export default router;
