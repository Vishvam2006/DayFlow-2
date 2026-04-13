import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const verifyUser = async (req, res, next) => {
  try {
    if (!process.env.JWT_KEY) {
      return res.status(500).json({
        success: false,
        error: "Server misconfigured (JWT key missing)",
      });
    }

    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, error: "Token not provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Token not provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User Not Found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

export default verifyUser;
