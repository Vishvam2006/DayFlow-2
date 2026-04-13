import express from "express";
import verifyUser from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { attachClientIp } from "../middleware/clientIpMiddleware.js";
import {
  getCurrentNetworkStatus,
  setCurrentOfficeIp,
} from "../controller/companyNetworkController.js";

const router = express.Router();

router.get("/current", verifyUser, adminMiddleware, attachClientIp, getCurrentNetworkStatus);
router.post("/set-current", verifyUser, adminMiddleware, attachClientIp, setCurrentOfficeIp);

export default router;

