import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    checkIn,
    checkOut,
    getAttendance,
    getYearAttendance,
} from "../controller/attendanceController.js";

const router = express.Router();

router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/today", authMiddleware, getAttendance);
router.get("/year", authMiddleware, getYearAttendance);


export default router;
