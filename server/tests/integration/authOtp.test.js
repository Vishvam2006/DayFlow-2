import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../app.js";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import User from "../../models/User.js";
import EmailOtp from "../../models/EmailOtp.js";

const { sendOTP } = vi.hoisted(() => ({
  sendOTP: vi.fn().mockResolvedValue({ data: { id: "email_123" } }),
}));

vi.mock("../../services/email/emailService.js", async () => {
  const actual = await vi.importActual("../../services/email/emailService.js");
  return {
    ...actual,
    sendOTP,
  };
});

describe("OTP Login Integration Tests", () => {
  beforeAll(async () => await connectDB());
  afterAll(async () => await disconnectDB());
  beforeEach(async () => {
    await clearDB();
    sendOTP.mockClear();
  });

  test("stores a hashed OTP in MongoDB and sends email for a valid user", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Priya Sharma",
      email: "priya@example.com",
      phoneNumber: "+919400000010",
      password: hashedPassword,
      role: "employee",
    });

    const response = await request(app)
      .post("/api/auth/login/send-otp")
      .send({ email: "priya@example.com" });

    expect(response.status).toBe(200);
    expect(sendOTP).toHaveBeenCalledTimes(1);

    const record = await EmailOtp.findOne({
      email: "priya@example.com",
      purpose: "login",
    });

    expect(record).toBeTruthy();
    expect(record.otpHash).not.toBe("");
    expect(record.attempts).toBe(0);
    expect(record.maxAttempts).toBe(5);
  });

  test("enforces OTP attempt limits using the persisted record", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Arjun Mehta",
      email: "arjun@example.com",
      phoneNumber: "+919400000011",
      password: hashedPassword,
      role: "employee",
    });

    await request(app)
      .post("/api/auth/login/send-otp")
      .send({ email: "arjun@example.com" });

    const record = await EmailOtp.findOne({
      email: "arjun@example.com",
      purpose: "login",
    });

    record.attempts = 5;
    await record.save();

    const response = await request(app)
      .post("/api/auth/login/verify-otp")
      .send({ email: "arjun@example.com", otp: "000000" });

    expect(response.status).toBe(429);
    expect(response.body.message).toBe("Too many attempts. Try again.");

    const deleted = await EmailOtp.findOne({
      email: "arjun@example.com",
      purpose: "login",
    });

    expect(deleted).toBeNull();
  });
});
