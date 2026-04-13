import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Task from "../models/Task.js";
import Payroll from "../models/Payroll.js";
import Leave from "../models/Leave.js";
import Department from "../models/Department.js";
import Attendance from "../models/Attendance.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URL = process.env.MONGO_URI || process.env.MONGODB_URL;

const connectDB = async () => {
  if (!MONGO_URL) {
    throw new Error(
      "Missing Mongo connection string. Set MONGO_URI or MONGODB_URL in .env",
    );
  }
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

const makeDate = (day) =>
  new Date(`2026-03-${String(day).padStart(2, "0")}T09:00:00.000Z`);

const seedData = async () => {
  await Department.insertMany([
    { dep_name: "Engineering", description: "Product development team" },
    { dep_name: "HR", description: "Employee management" },
    { dep_name: "Sales", description: "Revenue generation" },
  ]);

  const usersData = [
    {
      name: "Aarav Mehta",
      email: "aarav@test.com",
      phoneNumber: "+919100000001",
      password: "123456",
      role: "employee",
      department: "Engineering",
      jobTitle: "Backend Developer",
      employeeId: "EMP001",
      salaryStructure: {
        basicSalary: 60000,
        hra: 20000,
        allowances: 10000,
        bonus: 5000,
        taxDeduction: 8000,
        pfDeduction: 3000,
      },
    },
    {
      name: "Riya Sharma",
      email: "riya@test.com",
      phoneNumber: "+919100000002",
      password: "123456",
      role: "employee",
      department: "Engineering",
      jobTitle: "Frontend Developer",
      employeeId: "EMP002",
      salaryStructure: {
        basicSalary: 50000,
        hra: 18000,
        allowances: 8000,
        bonus: 2000,
        taxDeduction: 7000,
        pfDeduction: 2500,
      },
    },
    {
      name: "Karan Patel",
      email: "karan@test.com",
      phoneNumber: "+919100000003",
      password: "123456",
      role: "employee",
      department: "Sales",
      jobTitle: "Sales Executive",
      employeeId: "EMP003",
      salaryStructure: {
        basicSalary: 42000,
        hra: 15000,
        allowances: 7000,
        bonus: 1000,
        taxDeduction: 5000,
        pfDeduction: 2000,
      },
    },
    {
      name: "Neha Verma",
      email: "neha@test.com",
      phoneNumber: "+919100000004",
      password: "123456",
      role: "employee",
      department: "HR",
      jobTitle: "HR Manager",
      employeeId: "EMP004",
      salaryStructure: {
        basicSalary: 55000,
        hra: 20000,
        allowances: 9000,
        bonus: 3000,
        taxDeduction: 7500,
        pfDeduction: 2800,
      },
    },
    {
      name: "Aditya Singh",
      email: "aditya@test.com",
      phoneNumber: "+919100000005",
      password: "123456",
      role: "employee",
      department: "Engineering",
      jobTitle: "Intern",
      employeeId: "EMP005",
      salaryStructure: {
        basicSalary: 22000,
        hra: 8000,
        allowances: 3000,
        bonus: 0,
        taxDeduction: 1000,
        pfDeduction: 500,
      },
    },
  ];

  const users = [];
  for (const u of usersData) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const user = await User.create({ ...u, password: hashedPassword });
    users.push(user);
  }

  // =====================
  // EXTRA LOGIN USERS (Dummy + Meet)
  // =====================

  const extraUsers = [
    {
      name: "Dummy User",
      email: "dumvm41@gmail.com",
      phoneNumber: "+919100000006",
      password: "Dummy123#",
      role: "employee",
      department: "Engineering",
      jobTitle: "Tester",
      employeeId: "EMP900",
    },
    {
      name: "Meet Patel",
      email: "meet.p45822@gmail.com",
      phoneNumber: "+919100000007",
      password: "Meet.1212",
      role: "employee",
      department: "Engineering",
      jobTitle: "Support Engineer",
      employeeId: "EMP901",
    },
  ];

  for (let u of extraUsers) {
    const existingUser = await User.findOne({ email: u.email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(u.password, 10);

      await User.create({
        ...u,
        password: hashedPassword,
      });
    }
  }

  let admin = await User.findOne({ email: "admin@dayflow.com" });

  if (!admin) {
    const hashedAdmin = await bcrypt.hash("admin123", 10);

    admin = await User.create({
      name: "Admin",
      email: "admin@dayflow.com",
      phoneNumber: "+919100000000",
      password: hashedAdmin,
      role: "admin",
    });
  }

  await Task.insertMany([
    // Aarav: strong performer
    {
      title: "Build API Layer",
      description: "Set up scalable endpoints",
      assignedTo: users[0]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "Completed",
      dueDate: makeDate(5),
    },
    {
      title: "Refactor Auth Flow",
      description: "Improve token handling",
      assignedTo: users[0]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "Completed",
      dueDate: makeDate(8),
    },
    {
      title: "Optimize DB Queries",
      description: "Reduce response times",
      assignedTo: users[0]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "Completed",
      dueDate: makeDate(12),
    },
    {
      title: "Add Logging Middleware",
      description: "Track request tracing",
      assignedTo: users[0]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "In Progress",
      dueDate: makeDate(18),
    },

    // Riya: burnout risk
    {
      title: "UI Revamp",
      description: "New dashboard layout",
      assignedTo: users[1]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "In Progress",
      dueDate: makeDate(6),
    },
    {
      title: "Fix Card Spacing",
      description: "Alignment issues in dashboard",
      assignedTo: users[1]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "Pending",
      dueDate: makeDate(10),
    },
    {
      title: "Theme Polish",
      description: "Improve visual consistency",
      assignedTo: users[1]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "Pending",
      dueDate: makeDate(14),
    },
    {
      title: "Bug Sweep",
      description: "Resolve reported frontend bugs",
      assignedTo: users[1]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "Completed",
      dueDate: makeDate(20),
    },

    // Karan: low productivity
    {
      title: "Client Follow-ups",
      description: "Call pending leads",
      assignedTo: users[2]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "Pending",
      dueDate: makeDate(4),
    },
    {
      title: "Proposal Drafts",
      description: "Prepare pricing proposals",
      assignedTo: users[2]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "Pending",
      dueDate: makeDate(9),
    },
    {
      title: "CRM Update",
      description: "Update lead records",
      assignedTo: users[2]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "In Progress",
      dueDate: makeDate(15),
    },

    // Neha: balanced
    {
      title: "Recruitment Drive",
      description: "Shortlist candidates",
      assignedTo: users[3]._id,
      assignedBy: admin._id,
      priority: "High",
      status: "Completed",
      dueDate: makeDate(7),
    },
    {
      title: "Policy Update",
      description: "Revise leave policy",
      assignedTo: users[3]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "Completed",
      dueDate: makeDate(11),
    },
    {
      title: "Onboarding Plan",
      description: "Prepare induction checklist",
      assignedTo: users[3]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "Completed",
      dueDate: makeDate(16),
    },
    {
      title: "Team Feedback",
      description: "Collect feedback forms",
      assignedTo: users[3]._id,
      assignedBy: admin._id,
      priority: "Low",
      status: "In Progress",
      dueDate: makeDate(22),
    },

    // Aditya: new joiner
    {
      title: "Learn React Basics",
      description: "Complete onboarding module",
      assignedTo: users[4]._id,
      assignedBy: admin._id,
      priority: "Medium",
      status: "In Progress",
      dueDate: makeDate(8),
    },
    {
      title: "Build Small Component",
      description: "Create reusable button",
      assignedTo: users[4]._id,
      assignedBy: admin._id,
      priority: "Low",
      status: "Pending",
      dueDate: makeDate(12),
    },
    {
      title: "Study API Integration",
      description: "Read project docs",
      assignedTo: users[4]._id,
      assignedBy: admin._id,
      priority: "Low",
      status: "Pending",
      dueDate: makeDate(17),
    },
    {
      title: "Shadow Pairing Session",
      description: "Work with senior dev",
      assignedTo: users[4]._id,
      assignedBy: admin._id,
      priority: "Low",
      status: "Completed",
      dueDate: makeDate(21),
    },
  ]);

  await Leave.insertMany([
    {
      employee: users[1]._id,
      leaveType: "Sick",
      fromDate: new Date("2026-03-03"),
      toDate: new Date("2026-03-04"),
      reason: "Migraine and fatigue",
      status: "Approved",
    },
    {
      employee: users[1]._id,
      leaveType: "Sick",
      fromDate: new Date("2026-03-18"),
      toDate: new Date("2026-03-19"),
      reason: "Doctor advised rest",
      status: "Approved",
    },

    {
      employee: users[2]._id,
      leaveType: "Unpaid",
      fromDate: new Date("2026-03-11"),
      toDate: new Date("2026-03-13"),
      reason: "Personal issues",
      status: "Approved",
    },
    {
      employee: users[2]._id,
      leaveType: "Casual",
      fromDate: new Date("2026-03-24"),
      toDate: new Date("2026-03-24"),
      reason: "Urgent work at home",
      status: "Pending",
    },

    {
      employee: users[3]._id,
      leaveType: "Paid",
      fromDate: new Date("2026-03-14"),
      toDate: new Date("2026-03-14"),
      reason: "Family event",
      status: "Approved",
    },

    {
      employee: users[4]._id,
      leaveType: "Casual",
      fromDate: new Date("2026-03-20"),
      toDate: new Date("2026-03-20"),
      reason: "College visit",
      status: "Approved",
    },
  ]);

  const attendanceData = [];

  const addAttendance = (user, pattern) => {
    for (const row of pattern) {
      attendanceData.push({
        employee: user._id,
        date: row.date,
        status: row.status,
        workHours: row.workHours ?? 0,
        checkIn: row.checkIn ? new Date(row.checkIn) : undefined,
        checkOut: row.checkOut ? new Date(row.checkOut) : undefined,
      });
    }
  };

  // Aarav: very strong attendance
  addAttendance(users[0], [
    {
      date: "2026-03-01",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-01T09:05:00Z",
      checkOut: "2026-03-01T18:10:00Z",
    },
    {
      date: "2026-03-02",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-02T09:00:00Z",
      checkOut: "2026-03-02T18:00:00Z",
    },
    {
      date: "2026-03-03",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-03T09:10:00Z",
      checkOut: "2026-03-03T18:05:00Z",
    },
    {
      date: "2026-03-04",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-04T09:02:00Z",
      checkOut: "2026-03-04T18:00:00Z",
    },
    {
      date: "2026-03-05",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-05T09:08:00Z",
      checkOut: "2026-03-05T18:15:00Z",
    },
    {
      date: "2026-03-06",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-06T09:00:00Z",
      checkOut: "2026-03-06T18:00:00Z",
    },
    {
      date: "2026-03-07",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-07T09:07:00Z",
      checkOut: "2026-03-07T17:55:00Z",
    },
    {
      date: "2026-03-08",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-08T09:03:00Z",
      checkOut: "2026-03-08T18:00:00Z",
    },
    {
      date: "2026-03-09",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-09T09:01:00Z",
      checkOut: "2026-03-09T18:06:00Z",
    },
    {
      date: "2026-03-10",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-10T09:06:00Z",
      checkOut: "2026-03-10T18:00:00Z",
    },
    {
      date: "2026-03-11",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-11T09:05:00Z",
      checkOut: "2026-03-11T18:08:00Z",
    },
    {
      date: "2026-03-12",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-12T09:02:00Z",
      checkOut: "2026-03-12T18:00:00Z",
    },
    {
      date: "2026-03-13",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-13T09:00:00Z",
      checkOut: "2026-03-13T18:00:00Z",
    },
    {
      date: "2026-03-14",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-14T09:04:00Z",
      checkOut: "2026-03-14T18:02:00Z",
    },
    {
      date: "2026-03-15",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-15T09:06:00Z",
      checkOut: "2026-03-15T18:04:00Z",
    },
    {
      date: "2026-03-16",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-16T09:03:00Z",
      checkOut: "2026-03-16T18:00:00Z",
    },
    {
      date: "2026-03-17",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-17T09:01:00Z",
      checkOut: "2026-03-17T18:05:00Z",
    },
    {
      date: "2026-03-18",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-18T09:00:00Z",
      checkOut: "2026-03-18T18:00:00Z",
    },
    {
      date: "2026-03-19",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-19T09:07:00Z",
      checkOut: "2026-03-19T18:00:00Z",
    },
    {
      date: "2026-03-20",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-20T09:05:00Z",
      checkOut: "2026-03-20T18:10:00Z",
    },
    {
      date: "2026-03-21",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-21T09:02:00Z",
      checkOut: "2026-03-21T18:00:00Z",
    },
    {
      date: "2026-03-22",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-22T09:01:00Z",
      checkOut: "2026-03-22T18:00:00Z",
    },
    {
      date: "2026-03-23",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-23T09:03:00Z",
      checkOut: "2026-03-23T18:07:00Z",
    },
    {
      date: "2026-03-24",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-24T09:00:00Z",
      checkOut: "2026-03-24T18:00:00Z",
    },
    {
      date: "2026-03-25",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-25T09:04:00Z",
      checkOut: "2026-03-25T18:00:00Z",
    },
    {
      date: "2026-03-26",
      status: "Present",
      workHours: 8,
      checkIn: "2026-03-26T09:02:00Z",
      checkOut: "2026-03-26T18:00:00Z",
    },
  ]);

  // Riya: overloaded and inconsistent
  addAttendance(users[1], [
    { date: "2026-03-01", status: "Present", workHours: 8 },
    { date: "2026-03-02", status: "Present", workHours: 8 },
    { date: "2026-03-03", status: "Absent", workHours: 0 },
    { date: "2026-03-04", status: "Absent", workHours: 0 },
    { date: "2026-03-05", status: "Present", workHours: 8 },
    { date: "2026-03-06", status: "Half Day", workHours: 4 },
    { date: "2026-03-07", status: "Present", workHours: 8 },
    { date: "2026-03-08", status: "Absent", workHours: 0 },
    { date: "2026-03-09", status: "Half Day", workHours: 4 },
    { date: "2026-03-10", status: "Present", workHours: 8 },
    { date: "2026-03-11", status: "Present", workHours: 8 },
    { date: "2026-03-12", status: "Absent", workHours: 0 },
    { date: "2026-03-13", status: "Present", workHours: 8 },
    { date: "2026-03-14", status: "Half Day", workHours: 4 },
    { date: "2026-03-15", status: "Present", workHours: 8 },
    { date: "2026-03-16", status: "Absent", workHours: 0 },
    { date: "2026-03-17", status: "Present", workHours: 8 },
    { date: "2026-03-18", status: "Absent", workHours: 0 },
    { date: "2026-03-19", status: "Present", workHours: 8 },
    { date: "2026-03-20", status: "Half Day", workHours: 4 },
    { date: "2026-03-21", status: "Present", workHours: 8 },
    { date: "2026-03-22", status: "Absent", workHours: 0 },
    { date: "2026-03-23", status: "Present", workHours: 8 },
    { date: "2026-03-24", status: "Present", workHours: 8 },
    { date: "2026-03-25", status: "Absent", workHours: 0 },
    { date: "2026-03-26", status: "Half Day", workHours: 4 },
  ]);

  // Karan: low attendance and poor output
  addAttendance(users[2], [
    { date: "2026-03-01", status: "Absent", workHours: 0 },
    { date: "2026-03-02", status: "Absent", workHours: 0 },
    { date: "2026-03-03", status: "Present", workHours: 7 },
    { date: "2026-03-04", status: "Absent", workHours: 0 },
    { date: "2026-03-05", status: "Present", workHours: 7 },
    { date: "2026-03-06", status: "Absent", workHours: 0 },
    { date: "2026-03-07", status: "Half Day", workHours: 4 },
    { date: "2026-03-08", status: "Absent", workHours: 0 },
    { date: "2026-03-09", status: "Present", workHours: 6 },
    { date: "2026-03-10", status: "Absent", workHours: 0 },
    { date: "2026-03-11", status: "Present", workHours: 7 },
    { date: "2026-03-12", status: "Absent", workHours: 0 },
    { date: "2026-03-13", status: "Half Day", workHours: 4 },
    { date: "2026-03-14", status: "Absent", workHours: 0 },
    { date: "2026-03-15", status: "Present", workHours: 7 },
    { date: "2026-03-16", status: "Absent", workHours: 0 },
    { date: "2026-03-17", status: "Present", workHours: 7 },
    { date: "2026-03-18", status: "Absent", workHours: 0 },
    { date: "2026-03-19", status: "Present", workHours: 6 },
    { date: "2026-03-20", status: "Absent", workHours: 0 },
    { date: "2026-03-21", status: "Half Day", workHours: 4 },
    { date: "2026-03-22", status: "Absent", workHours: 0 },
    { date: "2026-03-23", status: "Present", workHours: 7 },
    { date: "2026-03-24", status: "Absent", workHours: 0 },
    { date: "2026-03-25", status: "Absent", workHours: 0 },
    { date: "2026-03-26", status: "Present", workHours: 6 },
  ]);

  // Neha: stable and balanced
  addAttendance(users[3], [
    { date: "2026-03-01", status: "Present", workHours: 8 },
    { date: "2026-03-02", status: "Present", workHours: 8 },
    { date: "2026-03-03", status: "Present", workHours: 8 },
    { date: "2026-03-04", status: "Present", workHours: 8 },
    { date: "2026-03-05", status: "Half Day", workHours: 4 },
    { date: "2026-03-06", status: "Present", workHours: 8 },
    { date: "2026-03-07", status: "Present", workHours: 8 },
    { date: "2026-03-08", status: "Present", workHours: 8 },
    { date: "2026-03-09", status: "Absent", workHours: 0 },
    { date: "2026-03-10", status: "Present", workHours: 8 },
    { date: "2026-03-11", status: "Present", workHours: 8 },
    { date: "2026-03-12", status: "Present", workHours: 8 },
    { date: "2026-03-13", status: "Present", workHours: 8 },
    { date: "2026-03-14", status: "Present", workHours: 8 },
    { date: "2026-03-15", status: "Half Day", workHours: 4 },
    { date: "2026-03-16", status: "Present", workHours: 8 },
    { date: "2026-03-17", status: "Present", workHours: 8 },
    { date: "2026-03-18", status: "Present", workHours: 8 },
    { date: "2026-03-19", status: "Present", workHours: 8 },
    { date: "2026-03-20", status: "Absent", workHours: 0 },
    { date: "2026-03-21", status: "Present", workHours: 8 },
    { date: "2026-03-22", status: "Present", workHours: 8 },
    { date: "2026-03-23", status: "Present", workHours: 8 },
    { date: "2026-03-24", status: "Present", workHours: 8 },
    { date: "2026-03-25", status: "Half Day", workHours: 4 },
    { date: "2026-03-26", status: "Present", workHours: 8 },
  ]);

  // Aditya: new joiner, inconsistent
  addAttendance(users[4], [
    { date: "2026-03-01", status: "Absent", workHours: 0 },
    { date: "2026-03-02", status: "Absent", workHours: 0 },
    { date: "2026-03-03", status: "Present", workHours: 6 },
    { date: "2026-03-04", status: "Half Day", workHours: 4 },
    { date: "2026-03-05", status: "Absent", workHours: 0 },
    { date: "2026-03-06", status: "Present", workHours: 6 },
    { date: "2026-03-07", status: "Absent", workHours: 0 },
    { date: "2026-03-08", status: "Half Day", workHours: 4 },
    { date: "2026-03-09", status: "Present", workHours: 6 },
    { date: "2026-03-10", status: "Absent", workHours: 0 },
    { date: "2026-03-11", status: "Present", workHours: 6 },
    { date: "2026-03-12", status: "Absent", workHours: 0 },
    { date: "2026-03-13", status: "Half Day", workHours: 4 },
    { date: "2026-03-14", status: "Present", workHours: 6 },
    { date: "2026-03-15", status: "Absent", workHours: 0 },
    { date: "2026-03-16", status: "Present", workHours: 6 },
    { date: "2026-03-17", status: "Absent", workHours: 0 },
    { date: "2026-03-18", status: "Half Day", workHours: 4 },
    { date: "2026-03-19", status: "Absent", workHours: 0 },
    { date: "2026-03-20", status: "Present", workHours: 6 },
    { date: "2026-03-21", status: "Absent", workHours: 0 },
    { date: "2026-03-22", status: "Present", workHours: 6 },
    { date: "2026-03-23", status: "Half Day", workHours: 4 },
    { date: "2026-03-24", status: "Absent", workHours: 0 },
    { date: "2026-03-25", status: "Present", workHours: 6 },
    { date: "2026-03-26", status: "Absent", workHours: 0 },
  ]);

  await Attendance.insertMany(attendanceData);

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
      presentDays:
        user.name === "Aarav Mehta"
          ? 26
          : user.name === "Riya Sharma"
            ? 15
            : user.name === "Karan Patel"
              ? 10
              : user.name === "Neha Verma"
                ? 21
                : 9,
      halfDays:
        user.name === "Aarav Mehta"
          ? 0
          : user.name === "Riya Sharma"
            ? 4
            : user.name === "Karan Patel"
              ? 4
              : user.name === "Neha Verma"
                ? 3
                : 5,
      unpaidLeaveDays: user.name === "Karan Patel" ? 2 : 0,
      paidLeaveDays:
        user.name === "Neha Verma"
          ? 1
          : user.name === "Riya Sharma"
            ? 2
            : user.name === "Aditya Singh"
              ? 1
              : 0,
      deductionDays:
        user.name === "Aarav Mehta"
          ? 0
          : user.name === "Riya Sharma"
            ? 7
            : user.name === "Karan Patel"
              ? 12
              : user.name === "Neha Verma"
                ? 4
                : 14,
    },
    breakdown: {
      grossSalary:
        user.salaryStructure.basicSalary +
        user.salaryStructure.hra +
        user.salaryStructure.allowances +
        user.salaryStructure.bonus,
      totalEarnings:
        user.salaryStructure.basicSalary +
        user.salaryStructure.hra +
        user.salaryStructure.allowances +
        user.salaryStructure.bonus,
      totalDeductions:
        user.salaryStructure.taxDeduction + user.salaryStructure.pfDeduction,
      netSalary:
        user.salaryStructure.basicSalary +
        user.salaryStructure.hra +
        user.salaryStructure.allowances +
        user.salaryStructure.bonus -
        user.salaryStructure.taxDeduction -
        user.salaryStructure.pfDeduction,
    },
    generatedBy: admin._id,
  }));

  await Payroll.insertMany(payrolls);

  console.log("Seeding Completed");
};

const run = async () => {
  try {
    await connectDB();
    await clearDB();
    await seedData();
  } catch (err) {
    console.error("Seed error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
