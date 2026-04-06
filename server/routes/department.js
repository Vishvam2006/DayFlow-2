import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import adminMiddleware from '../middleware/adminMiddleware.js';
import { addDepartment, getDepartments, deleteDepartment, updateDepartment, getDepartmentById } from '../controller/departmentController.js';

const router = express.Router();

router.post("/add", authMiddleware, adminMiddleware, addDepartment);
router.get("/", authMiddleware, adminMiddleware, getDepartments);
router.get("/:id", authMiddleware, adminMiddleware, getDepartmentById);   // fetch one
router.put("/:id", authMiddleware, adminMiddleware, updateDepartment);    // update
router.delete("/:id", authMiddleware, adminMiddleware, deleteDepartment); // delete


export default router;
