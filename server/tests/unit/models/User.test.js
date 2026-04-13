import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectDB, disconnectDB, clearDB } from "../../setup.js";
import User from "../../../models/User.js";

describe("User Model Tests", () => {
    beforeAll(async () => await connectDB());
    afterAll(async () => await disconnectDB());
    beforeEach(async () => await clearDB());

    test("should create a valid user", async () => {
        const validUser = new User({
            name: "John Doe",
            email: "john@example.com",
            phoneNumber: "+919300000001",
            password: "password123",
            role: "employee"
        });
        const savedUser = await validUser.save();
        expect(savedUser._id).toBeDefined();
        expect(savedUser.name).toBe("John Doe");
    });

    test("should fail if name is missing", async () => {
        const userWithoutName = new User({
            email: "john@example.com",
            phoneNumber: "+919300000002",
            password: "password123",
            role: "employee"
        });
        let err;
        try {
            await userWithoutName.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.name).toBeDefined();
    });

    test("should fail if email is invalid", async () => {
        const userWithInvalidEmail = new User({
            name: "John",
            email: "not-an-email",
            phoneNumber: "+919300000003",
            password: "password123",
            role: "employee"
        });
        let err;
        try {
            await userWithInvalidEmail.save();
        } catch (error) {
            err = error;
        }
        
        expect(err).toBeDefined();
        expect(err.name).toBe("ValidationError");
        expect(err.errors.email).toBeDefined();
    });

    test("should fail if phoneNumber is not E.164 formatted", async () => {
        const userWithInvalidPhone = new User({
            name: "John",
            email: "john@example.com",
            phoneNumber: "9300000004",
            password: "password123",
            role: "employee"
        });
        let err;
        try {
            await userWithInvalidPhone.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        expect(err.name).toBe("ValidationError");
        expect(err.errors.phoneNumber).toBeDefined();
    });

    test("should fail for duplicate email", async () => {
        const user1 = new User({
            name: "User 1",
            email: "same@example.com",
            phoneNumber: "+919300000005",
            password: "password",
            role: "employee"
        });
        await user1.save();

        const user2 = new User({
            name: "User 2",
            email: "same@example.com",
            phoneNumber: "+919300000006",
            password: "password",
            role: "employee"
        });
        
        let err;
        try {
            await user2.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeDefined();
        expect(err.code).toBe(11000);
    });
});
