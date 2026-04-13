import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { attachClientIp } from "../middleware/clientIpMiddleware.js";
import {
    checkIn,
    checkOut,
    getAttendance,
    getYearAttendance,
    verifyClockInNetwork,
} from "../controller/attendanceController.js";

const router = express.Router();

router.post("/check-in", authMiddleware, attachClientIp, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/today", authMiddleware, getAttendance);
router.get("/year", authMiddleware, getYearAttendance);
router.get("/network-status", authMiddleware, attachClientIp, verifyClockInNetwork);


export default router;
