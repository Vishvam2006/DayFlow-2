import express from 'express';
import verifyUser from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  updateEmployeeSalaryStructure,
} from '../controller/employeeController.js';

const router = express.Router();

// GET all employees — admin only
router.get("/get", verifyUser, adminMiddleware, getEmployees);

// POST add new employee — admin only
router.post("/add", verifyUser, adminMiddleware, addEmployee);

// PUT update employee salary structure — admin only
router.put("/:id/salary", verifyUser, adminMiddleware, updateEmployeeSalaryStructure);

// DELETE an employee — admin only
router.delete("/:id", verifyUser, adminMiddleware, deleteEmployee);

export default router;
