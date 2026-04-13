import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../app.js";
import { connectDB, disconnectDB, clearDB } from "../setup.js";
import User from "../../models/User.js";

describe("Auth Integration Tests", () => {
    beforeAll(async () => await connectDB());
    afterAll(async () => await disconnectDB());
    beforeEach(async () => await clearDB());

    describe("POST /api/auth/login", () => {
        test("should login successfully with valid credentials", async () => {
            const password = "password123";
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                name: "Admin User",
                email: "admin@example.com",
                phoneNumber: "+919400000001",
                password: hashedPassword,
                role: "admin"
            });
            await user.save();

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "admin@example.com",
                    password: password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe("admin@example.com");
        });

        test("should return 401 for wrong password", async () => {
            const hashedPassword = await bcrypt.hash("correct-password", 10);
            const user = new User({
                name: "User",
                email: "user@example.com",
                phoneNumber: "+919400000002",
                password: hashedPassword,
                role: "employee"
            });
            await user.save();

            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "user@example.com",
                    password: "wrong-password"
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Wrong Password");
        });

        test("should return 404 for non-existent user", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "ghost@example.com",
                    password: "any"
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });
    });
});
