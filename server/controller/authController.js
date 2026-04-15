import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { createAndSendLoginOtp, verifyLoginOtp } from "../services/otpService.js";

dotenv.config();

const buildAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber || "",
  role: user.role,
  jobTitle: user.jobTitle || "",
  department: user.department || "",
  employeeId: user.employeeId || "",
  bio: user.bio || "",
  profileImage: user.profileImage || "",
});

const sendOtpLogin = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Avoid account enumeration: always return generic success.
    if (!user) {
      return res.json({ message: "If the account exists, an OTP was sent." });
    }

    await createAndSendLoginOtp(email);

    return res.json({ message: "If the account exists, an OTP was sent." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const verifyOtpLogin = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const verification = await verifyLoginOtp(email, otp);
    if (!verification.ok) {
      return res.status(verification.statusCode).json({ message: verification.message });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "10d" },
    );

    return res.status(200).json({
      success: true,
      token,
      user: buildAuthUser(user),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Wrong Password" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "10d" },
    );

    return res.status(200).json({
      success: true,
      token,
      user: buildAuthUser(user),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const verify = (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

export { login, verify, sendOtpLogin, verifyOtpLogin };
