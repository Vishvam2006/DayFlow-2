import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import Leave from "../../models/Leave.js";

const BOT_SECRET = "test-bot-secret";

const withBotSecret = (req) => req.set("x-bot-secret-key", BOT_SECRET);

const getFutureIsoDate = (daysFromNow) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
};

describe("Bot Integration Tests", () => {
  let employeeUser;
  let adminUser;

  beforeAll(async () => {
    process.env.BOT_SECRET_KEY = BOT_SECRET;
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    employeeUser = await User.create({
      name: "Priya Sharma",
      email: "priya@example.com",
      phoneNumber: "+919811111111",
      password: "password123",
      role: "employee",
      employeeId: "EMP-2026-1001",
      department: "Engineering",
      jobTitle: "Developer",
    });

    adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      phoneNumber: "+919822222222",
      password: "password123",
      role: "admin",
      employeeId: "ADM-2026-0001",
    });
  });

  test("verifies an employee by registered phone number and returns empId mapping", async () => {
    const res = await withBotSecret(request(app).post("/api/bot/verify-employee"))
      .send({ phoneNumber: employeeUser.phoneNumber });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verified).toBe(true);
    expect(res.body.employee.empId).toBe("EMP-2026-1001");
    expect(res.body.employee.employeeId).toBe("EMP-2026-1001");
    expect(res.body.employee.phoneNumber).toBe(employeeUser.phoneNumber);
  });

  test("creates a leave request from the bot for the mapped employee", async () => {
    const fromDate = getFutureIsoDate(2);
    const toDate = getFutureIsoDate(4);

    const res = await withBotSecret(request(app).post("/api/bot/leaves/apply"))
      .send({
        empId: "EMP-2026-1001",
        leaveType: "Sick",
        fromDate,
        toDate,
        reason: "Doctor advised rest",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.employee.empId).toBe("EMP-2026-1001");
    expect(res.body.leave.employee.employeeId).toBe("EMP-2026-1001");
    expect(res.body.leave.leaveType).toBe("Sick");
    expect(res.body.leave.status).toBe("Pending");

    const leave = await Leave.findOne({ employee: employeeUser._id });
    expect(leave).toBeTruthy();
    expect(leave.leaveType).toBe("Sick");
    expect(leave.reason).toBe("Doctor advised rest");
  });

  test("blocks leave requests for non-employee users even if an empId is provided", async () => {
    const fromDate = getFutureIsoDate(2);
    const toDate = getFutureIsoDate(2);

    const res = await withBotSecret(request(app).post("/api/bot/leaves/apply"))
      .send({
        employeeId: adminUser.employeeId,
        leaveType: "Casual",
        fromDate,
        toDate,
        reason: "Should be rejected",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Only employees can apply for leave.");
  });

  test("supports bot attendance check-in, status lookup, and monthly summary", async () => {
    const checkInRes = await withBotSecret(request(app).post("/api/bot/attendance/check-in"))
      .send({ employeeId: employeeUser.employeeId });

    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.success).toBe(true);
    expect(checkInRes.body.attendance.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(checkInRes.body.attendance.isCheckedIn).toBe(true);

    const statusRes = await withBotSecret(request(app).get("/api/bot/attendance/today"))
      .query({ employeeId: employeeUser.employeeId });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.attendance.isCheckedIn).toBe(true);
    expect(statusRes.body.attendance.isCheckedOut).toBe(false);

    const summaryRes = await withBotSecret(
      request(app).get("/api/bot/attendance/monthly-summary")
    ).query({ employeeId: employeeUser.employeeId });

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.success).toBe(true);
    expect(summaryRes.body.summary.totalRecords).toBe(1);
    expect(summaryRes.body.summary.incompleteDays).toBe(1);
  });

  test("blocks duplicate bot attendance check-ins and check-out without check-in", async () => {
    await withBotSecret(request(app).post("/api/bot/attendance/check-in"))
      .send({ empId: employeeUser.employeeId });

    const duplicateRes = await withBotSecret(request(app).post("/api/bot/attendance/check-in"))
      .send({ employeeId: employeeUser.employeeId });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.code).toBe("already_checked_in");

    await clearDB();
    employeeUser = await User.create({
      name: "Priya Sharma",
      email: "priya@example.com",
      phoneNumber: "+919811111111",
      password: "password123",
      role: "employee",
      employeeId: "EMP-2026-1001",
      department: "Engineering",
      jobTitle: "Developer",
    });

    const checkOutRes = await withBotSecret(request(app).post("/api/bot/attendance/check-out"))
      .send({ employeeId: employeeUser.employeeId });

    expect(checkOutRes.status).toBe(400);
    expect(checkOutRes.body.success).toBe(false);
    expect(checkOutRes.body.code).toBe("missing_check_in");
  });

  test("checks out through bot and returns accurate work hours", async () => {
    await withBotSecret(request(app).post("/api/bot/attendance/check-in"))
      .send({ employeeId: employeeUser.employeeId });

    const attendance = await Attendance.findOne({ employee: employeeUser._id });
    attendance.checkIn = new Date(Date.now() - 9 * 60 * 60 * 1000);
    await attendance.save();

    const res = await withBotSecret(request(app).post("/api/bot/attendance/check-out"))
      .send({ employeeId: employeeUser.employeeId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attendance.status).toBe("Present");
    expect(res.body.attendance.workHours).toBeGreaterThanOrEqual(9);
  });
});
