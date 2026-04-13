import express from "express";
import verifyUser from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { attachClientIp } from "../middleware/clientIpMiddleware.js";
import {
  addCurrentNetworkIp,
  createApprovedNetwork,
  deleteApprovedNetwork,
  getCurrentNetworkStatus,
  listApprovedNetworks,
  setCurrentOfficeIp,
  updateApprovedNetwork,
} from "../controller/companyNetworkController.js";

const router = express.Router();

router.get("/", verifyUser, adminMiddleware, attachClientIp, listApprovedNetworks);
router.get("/current", verifyUser, adminMiddleware, attachClientIp, getCurrentNetworkStatus);
router.post("/", verifyUser, adminMiddleware, createApprovedNetwork);
router.post("/add-current", verifyUser, adminMiddleware, attachClientIp, addCurrentNetworkIp);
router.post("/set-current", verifyUser, adminMiddleware, attachClientIp, setCurrentOfficeIp);
router.put("/:id", verifyUser, adminMiddleware, updateApprovedNetwork);
router.delete("/:id", verifyUser, adminMiddleware, deleteApprovedNetwork);

export default router;

