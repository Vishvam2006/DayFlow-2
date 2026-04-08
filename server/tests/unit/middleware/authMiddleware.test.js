import { describe, test, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import User from "../../../models/User.js";
import verifyUser from "../../../middleware/authMiddleware.js";

vi.mock("jsonwebtoken");
vi.mock("../../../models/User.js");

describe("Auth Middleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: "Bearer valid-token"
            }
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        next = vi.fn();
        
        vi.clearAllMocks();
    });

    test("should pass for valid token and existing user", async () => {
        const mockUser = { _id: "user123", role: "admin" };
        
        vi.mocked(jwt.verify).mockImplementation(() => ({ _id: "user123" }));
        
        vi.mocked(User.findById).mockReturnValue({
            select: vi.fn().mockResolvedValue(mockUser)
        });

        await verifyUser(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(mockUser);
    });

    test("should return 401 if no authorization header", async () => {
        req.headers.authorization = undefined;

        await verifyUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Token not provided" }));
    });

    test("should return 401 if token is invalid", async () => {
        vi.mocked(jwt.verify).mockImplementation(() => { throw new Error("Invalid token") });

        await verifyUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test("should return 404 if user not found", async () => {
        vi.mocked(jwt.verify).mockImplementation(() => ({ _id: "user123" }));
        vi.mocked(User.findById).mockReturnValue({
            select: vi.fn().mockResolvedValue(null)
        });

        await verifyUser(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "User Not Found" }));
    });
});
