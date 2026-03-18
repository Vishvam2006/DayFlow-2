import User from "../models/User.js";
import fs from "fs";
import path from "path";

const updateProfile = async (req, res) => {
  try {
    const { name, jobTitle, bio } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (bio !== undefined) updateData.bio = bio;

    if (req.file) {
      // Get old user to delete previous image if it exists
      const oldUser = await User.findById(req.user._id);
      if (oldUser?.profileImage) {
        const oldPath = path.resolve(oldUser.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.profileImage = req.file.path.replace(/\\/g, "/");
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      select: "-password",
    });

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

export { updateProfile, getProfile };