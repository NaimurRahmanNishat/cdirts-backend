import express from "express";
import {
  activateUser,
  forgetPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  socialAuth,
  updateProfile,
} from "../controller/user.controller";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

// 🧩 User Authentication Routes
router.post("/register", registerUser);
router.post("/activate-user", activateUser);
router.post("/login", loginUser);
router.post("/social-auth", socialAuth);
router.post("/refresh-token", refreshAccessToken);

// 🔐 Password Management
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);

// 🚪 Logout & Profile
router.post("/logout", isAuthenticated, logoutUser);
router.patch("/update-profile", isAuthenticated, updateProfile);

export default router;
