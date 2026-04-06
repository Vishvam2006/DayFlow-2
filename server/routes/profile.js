import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  updateProfile,
  getProfile,
  changePassword,
} from "../controller/profileController.js";
import upload from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getProfile);
router.put(
  "/update",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile
);
router.put("/change-password", authMiddleware, changePassword);

export default router;
