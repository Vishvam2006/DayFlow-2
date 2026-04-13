import User, { E164_PHONE_NUMBER_REGEX } from "../models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { normalizeSalaryStructure } from "../utils/payroll.js";

// Helper: generate a secure random password
const generatePassword = () => {
  return crypto.randomBytes(9).toString("base64"); // 12 printable chars
};

// Helper: generate a unique employee ID (EMP-YYYY-XXXXXX)
const generateEmployeeId = () => {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `EMP-${year}-${rand}`;
};

const normalizeEmail = (email) =>
  typeof email === "string" ? email.toLowerCase().trim() : "";

const normalizePhoneNumber = (phoneNumber) =>
  typeof phoneNumber === "string" ? phoneNumber.trim() : "";

// GET /api/employee/get  — admin sees all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select(
      "name email phoneNumber jobTitle department employeeId profileImage createdAt salaryStructure"
    );
    return res.status(200).json({
      success: true,
      employeesCount: employees.length,
      employees,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch employees." });
  }
};

// POST /api/employee/add  — admin only
const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      jobTitle,
      department,
      salaryStructure = {},
    } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    // Validate required fields
    if (!name || !normalizedEmail || !normalizedPhoneNumber) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Name, email, and phoneNumber are required.",
        });
    }

    if (!E164_PHONE_NUMBER_REGEX.test(normalizedPhoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "phoneNumber must be in E.164 format (e.g., +91XXXXXXXXXX).",
      });
    }

    // Check for duplicate email or phone number
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { phoneNumber: normalizedPhoneNumber }],
    });
    if (existing) {
      const duplicateField =
        existing.email === normalizedEmail ? "email" : "phone number";
      return res
        .status(409)
        .json({
          success: false,
          error: `An account with this ${duplicateField} already exists.`,
        });
    }

    // Generate and hash password
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // Generate unique employee ID
    const employeeId = generateEmployeeId();

    // Create employee
    const employee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      password: hashedPassword,
      role: "employee",
      jobTitle: jobTitle?.trim() || "",
      department: department?.trim() || "",
      employeeId,
      salaryStructure: normalizeSalaryStructure(salaryStructure),
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      credentials: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        generatedPassword: plainPassword, // shown ONCE — not persisted
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || error.keyValue || {},
      )[0];
      return res.status(409).json({
        success: false,
        error: `An account with this ${duplicateField || "unique field"} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/employee/:id  — admin only
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOneAndDelete({ _id: id, role: "employee" });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found." });
    }
    return res
      .status(200)
      .json({ success: true, message: "Employee deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateEmployeeSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findOne({ _id: id, role: "employee" });
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, error: "Employee not found." });
    }

    employee.salaryStructure = normalizeSalaryStructure(req.body);
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Salary structure updated successfully.",
      employee,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export { getEmployees, addEmployee, deleteEmployee, updateEmployeeSalaryStructure };
