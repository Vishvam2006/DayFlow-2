import { describe, test, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import verifyUser from "../../middleware/authMiddleware.js";

// Mocking the middleware to bypass JWT for integration tests
vi.mock("../../middleware/authMiddleware.js", () => ({
    default: vi.fn((req, res, next) => next())
}));

describe("Attendance Integration Tests", () => {
    let testUser;

    beforeAll(async () => await connectDB());
    afterAll(async () => await disconnectDB());
    beforeEach(async () => {
        await clearDB();
        
        testUser = new User({
            name: "Test Employee",
            email: "test@example.com",
            phoneNumber: "+919500000001",
            password: "password123",
            role: "employee"
        });
        await testUser.save();
        
        // Mock implementation to populate req.user
        vi.mocked(verifyUser).mockImplementation((req, res, next) => {
            req.user = testUser;
            next();
        });
    });

    describe("POST /api/attendance/check-in", () => {
        test("should allow an employee to check in", async () => {
            const res = await request(app)
                .post("/api/attendance/check-in")
                .send();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.attendance).toBeDefined();
            
            const attendance = await Attendance.findOne({ employee: testUser._id });
            expect(attendance).toBeTruthy();
        });

        test("should prevent duplicate check-ins on the same day", async () => {
            await request(app).post("/api/attendance/check-in").send();

            const res = await request(app)
                .post("/api/attendance/check-in")
                .send();

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Already checked in today");
        });
    });

    describe("POST /api/attendance/check-out", () => {
        test("should allow checking out and calculate work hours", async () => {
            await request(app).post("/api/attendance/check-in").send();

            const attendance = await Attendance.findOne({ employee: testUser._id });
            attendance.checkIn = new Date(Date.now() - 9 * 60 * 60 * 1000);
            await attendance.save();

            const res = await request(app)
                .post("/api/attendance/check-out")
                .send();

            expect(res.status).toBe(200);
            expect(res.body.attendance.status).toBe("Present");
            expect(res.body.attendance.workHours).toBeGreaterThanOrEqual(9);
        });

        test("should fail if no check-in exists", async () => {
            const res = await request(app)
                .post("/api/attendance/check-out")
                .send();

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Check In first");
        });
    });
});
