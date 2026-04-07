import User from "../models/User.js";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import {
  PASSWORD_RULES_DESCRIPTION,
  validateStrongPassword,
} from "../utils/password.js";

const updateProfile = async (req, res) => {
  try {
    const { name, jobTitle, bio } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      // Get old user to delete previous image if it exists locally
      const oldUser = await User.findById(req.user._id);
      if (oldUser?.profileImage && !oldUser.profileImage.startsWith('http')) {
        const oldPath = path.resolve(oldUser.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      // req.file.path is now an absolute Cloudinary URL provided by CloudinaryStorage
      updateData.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match.",
      });
    }

    const validationMessage = validateStrongPassword(newPassword);
    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
        rules: PASSWORD_RULES_DESCRIPTION,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update password.",
    });
  }
};

export { updateProfile, getProfile, changePassword };
