import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  generatePayroll,
  getMyPayrolls,
  getPayrollById,
  getPayrolls,
  updateSalaryStructure,
} from "../controller/payrollController.js";

const router = express.Router();

router.post("/generate", authMiddleware, adminMiddleware, generatePayroll);
router.put(
  "/structure/:employeeId",
  authMiddleware,
  adminMiddleware,
  updateSalaryStructure
);
router.get("/me", authMiddleware, getMyPayrolls);
router.get("/", authMiddleware, adminMiddleware, getPayrolls);
router.get("/:id", authMiddleware, getPayrollById);

export default router;
