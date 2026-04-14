import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import User from "../../models/User.js";
import Leave from "../../models/Leave.js";
import verifyUser from "../../middleware/authMiddleware.js";
import adminMiddleware from "../../middleware/adminMiddleware.js";

vi.mock("../../middleware/authMiddleware.js", () => ({
  default: vi.fn((req, _res, next) => next()),
}));

vi.mock("../../middleware/adminMiddleware.js", () => ({
  default: vi.fn((_req, _res, next) => next()),
}));

const BOT_SECRET = "test-bot-secret";
const withBotSecret = (req) => req.set("x-bot-secret-key", BOT_SECRET);

describe("Leave Notification Integration Tests", () => {
  let adminUser;
  let employeeUser;
  let leave;

  beforeAll(async () => {
    process.env.BOT_SECRET_KEY = BOT_SECRET;
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();

    adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      phoneNumber: "+919811111119",
      password: "password123",
      role: "admin",
      employeeId: "ADM-2026-0001",
    });

    employeeUser = await User.create({
      name: "Priya Sharma",
      email: "priya@example.com",
      phoneNumber: "+919811111111",
      password: "password123",
      role: "employee",
      employeeId: "EMP-2026-1001",
      department: "Engineering",
    });

    leave = await Leave.create({
      employee: employeeUser._id,
      leaveType: "Sick",
      fromDate: new Date("2026-05-12T00:00:00.000Z"),
      toDate: new Date("2026-05-14T00:00:00.000Z"),
      reason: "Medical rest",
      status: "Pending",
    });

    vi.mocked(verifyUser).mockImplementation((req, _res, next) => {
      req.user = adminUser;
      next();
    });
    vi.mocked(adminMiddleware).mockImplementation((_req, _res, next) => next());
  });

  test("queues a leave notification when admin approves a leave and avoids duplicates after acknowledgement", async () => {
    const updateRes = await request(app)
      .put(`/api/leave/update-status/${leave._id}`)
      .send({ status: "Approved" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const claimRes = await withBotSecret(request(app).post("/api/bot/leave-notifications/claim"))
      .send({ limit: 10 });

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.success).toBe(true);
    expect(claimRes.body.notifications).toHaveLength(1);
    expect(claimRes.body.notifications[0].status).toBe("Approved");
    expect(claimRes.body.notifications[0].employee.phoneNumber).toBe(employeeUser.phoneNumber);

    const ackRes = await withBotSecret(
      request(app).post(`/api/bot/leave-notifications/${leave._id}/ack`)
    ).send({ status: "Approved" });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.success).toBe(true);

    const claimedAgain = await withBotSecret(request(app).post("/api/bot/leave-notifications/claim"))
      .send({ limit: 10 });
    expect(claimedAgain.body.notifications).toHaveLength(0);

    const sameStatusRes = await request(app)
      .put(`/api/leave/update-status/${leave._id}`)
      .send({ status: "Approved" });

    expect(sameStatusRes.status).toBe(200);
    const noDuplicateClaim = await withBotSecret(
      request(app).post("/api/bot/leave-notifications/claim")
    ).send({ limit: 10 });
    expect(noDuplicateClaim.body.notifications).toHaveLength(0);
  });

  test("includes rejection comments in the notification payload", async () => {
    const updateRes = await request(app)
      .put(`/api/leave/update-status/${leave._id}`)
      .send({ status: "Rejected", decisionComment: "Insufficient leave balance." });

    expect(updateRes.status).toBe(200);

    const claimRes = await withBotSecret(request(app).post("/api/bot/leave-notifications/claim"))
      .send({ limit: 10 });

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.notifications).toHaveLength(1);
    expect(claimRes.body.notifications[0].status).toBe("Rejected");
    expect(claimRes.body.notifications[0].decisionComment).toBe("Insufficient leave balance.");
  });

  test("records leave notification delivery failures", async () => {
    await request(app)
      .put(`/api/leave/update-status/${leave._id}`)
      .send({ status: "Approved" });

    const failRes = await withBotSecret(
      request(app).post(`/api/bot/leave-notifications/${leave._id}/fail`)
    ).send({
      status: "Approved",
      error: "The employee phone number is not reachable on WhatsApp.",
    });

    expect(failRes.status).toBe(200);
    expect(failRes.body.success).toBe(true);

    const refreshedLeave = await Leave.findById(leave._id);
    expect(refreshedLeave.notification.lastError).toBe(
      "The employee phone number is not reachable on WhatsApp.",
    );
    expect(refreshedLeave.notification.lastAttemptedStatus).toBe("Approved");
  });
});
