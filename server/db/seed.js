import User from "../models/User.js";
import Task from "../models/Task.js";
import Payroll from "../models/Payroll.js";
import Leave from "../models/Leave.js";
import Department from "../models/Department.js";
import Attendance from "../models/Attendance.js";
import bcrypt from "bcrypt";


import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URL = process.env.MONGODB_URL;

console.log(MONGO_URL);

const connectDB = async () => {
  await mongoose.connect(MONGO_URL);
  console.log("MongoDB Connected");
};

const clearDB = async () => {
  await Promise.all([
    User.deleteMany(),
    Task.deleteMany(),
    Payroll.deleteMany(),
    Leave.deleteMany(),
    Department.deleteMany(),
    Attendance.deleteMany(),
  ]);
  console.log("Database Cleared");
};

const seedData = async () => {
  // =====================
  // DEPARTMENTS
  // =====================
  const departments = await Department.insertMany([
    { dep_name: "Engineering", description: "Product development team" },
    { dep_name: "HR", description: "Employee management" },
    { dep_name: "Sales", description: "Revenue generation" },
  ]);

  // =====================
  // USERS
  // =====================





// =====================
// USERS
// =====================
const usersData = [
    {
      name: "Dummy User",
      email: "dumvm41@gmail.com",
      password: "Dummy123#",
      role: "employee",
      department: "Engineering",
      jobTitle: "Developer",
      employeeId: "EMP001",
    },
    {
      name: "Meet Patel",
      email: "meet.p45822@gmail.com",
      password: "Meet.1212",
      role: "employee",
      department: "Engineering",
      jobTitle: "Frontend Developer",
      employeeId: "EMP002",
    },
  
    // ✅ NEW USERS (your screenshot ones)
    {
      name: "Aarav Mehta",
      email: "aarav@test.com",
      password: "123456",
      role: "employee",
      department: "Engineering",
      jobTitle: "Backend Developer",
      employeeId: "EMP003",
    },
    {
      name: "Riya Sharma",
      email: "riya@test.com",
      password: "123456",
      role: "employee",
      department: "Engineering",
      jobTitle: "Frontend Developer",
      employeeId: "EMP004",
    },
    {
      name: "Karan Patel",
      email: "karan@test.com",
      password: "123456",
      role: "employee",
      department: "Sales",
      jobTitle: "Sales Executive",
      employeeId: "EMP005",
    },
    {
      name: "Neha Verma",
      email: "neha@test.com",
      password: "123456",
      role: "employee",
      department: "HR",
      jobTitle: "HR Manager",
      employeeId: "EMP006",
    },
    {
      name: "Aditya Singh",
      email: "aditya@test.com",
      password: "123456",
      role: "employee",
      department: "Engineering",
      jobTitle: "Intern",
      employeeId: "EMP007",
    },
  ];
  
  const users = [];
  
  for (let u of usersData) {
    const existingUser = await User.findOne({ email: u.email });
  
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
  
      const newUser = await User.create({
        ...u,
        password: hashedPassword,
      });
  
      users.push(newUser);
    } else {
      users.push(existingUser);
    }
  }


  let admin = await User.findOne({ email: "admin@dayflow.com" });

  if (!admin) {
    const hashedAdmin = await bcrypt.hash("admin123", 10);
  
    admin = await User.create({
      name: "Admin",
      email: "admin@dayflow.com",
      password: hashedAdmin,
      role: "admin",
    });
  }


  // =====================
  // TASKS (different behaviors)
  // =====================
  await Task.insertMany([
    {
      title: "Build Dashboard",
      assignedTo: users[0]._id,
      assignedBy: admin._id,
      status: "Completed",
    },
    {
      title: "Fix UI Bugs",
      assignedTo: users[1]._id,
      assignedBy: admin._id,
      status: "In Progress",
    },
  ]);

  // =====================
  // LEAVES
  // =====================
  await Leave.insertMany([
    {
      employee: users[1]._id,
      leaveType: "Sick",
      fromDate: new Date("2026-03-10"),
      toDate: new Date("2026-03-14"),
      status: "Approved",
    },
  ]);

  // =====================
  // ATTENDANCE (patterns)
  // =====================
  const attendanceData = [];

  const createAttendance = (user, presentDays, absentDays) => {
    let day = 1;

    for (let i = 0; i < presentDays; i++) {
      attendanceData.push({
        employee: user._id,
        date: `2026-03-${day++}`,
        status: "Present",
        workHours: 8,
      });
    }

    for (let i = 0; i < absentDays; i++) {
      attendanceData.push({
        employee: user._id,
        date: `2026-03-${day++}`,
        status: "Absent",
      });
    }
  };

  createAttendance(users[0], 24, 2); // strong performer
  createAttendance(users[1], 18, 8); // weaker performer

  await Attendance.insertMany(attendanceData);

  // =====================
  // PAYROLL
  // =====================
  const payrolls = users.map((user) => ({
    employee: user._id,
    month: "2026-03",
    monthLabel: "March 2026",
    employeeSnapshot: {
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      department: user.department,
      jobTitle: user.jobTitle,
    },
    salaryStructure: user.salaryStructure,
    attendanceSummary: {
      workingDays: 26,
      presentDays: 20,
      payableAttendanceDays: 20,
    },
    breakdown: {
      grossSalary: 80000,
      totalEarnings: 85000,
      totalDeductions: 12000,
      netSalary: 73000,
    },
    generatedBy: admin._id,
  }));

  await Payroll.insertMany(payrolls);

  console.log("Seeding Completed");
};

const run = async () => {
  await connectDB();
  await clearDB();
  await seedData();
  mongoose.disconnect();
};

run();