import express from "express";
import {
  login,
  verify,
  sendOtpLogin,
  verifyOtpLogin,
} from "../controller/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/login/send-otp", sendOtpLogin);
router.post("/login/verify-otp", verifyOtpLogin);

router.get("/verify", authMiddleware, verify);

export default router;
