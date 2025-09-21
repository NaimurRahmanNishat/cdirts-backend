import express from "express";
import { activateUser, forgetPassword, loginUser, logoutUser, refreshAccessToken, registerUser, resetPassword, socialAuth, updateProfile } from "../controller/user.controller";
import { isAuthenticated } from "../middleware/auth";

const router = express.Router();

// User registration route
router.post("/register", registerUser);
router.post("/activate-user", activateUser);

// User login route
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/social-auth", socialAuth);

// Password reset routes (OTP based) & logout
router.post("/forgot-password", forgetPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", isAuthenticated, logoutUser);

// Update user profile
router.patch("/update-profile", isAuthenticated, updateProfile);

export default router;