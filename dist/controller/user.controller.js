"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.logoutUser = exports.resetPassword = exports.forgetPassword = exports.socialAuth = exports.refreshAccessToken = exports.loginUser = exports.activateUser = exports.registerUser = void 0;
const user_model_1 = require("../models/user.model");
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../middleware/catchAsync");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const bcrypt_1 = __importDefault(require("bcrypt"));
const redis_1 = require("../utils/redis");
const cookie_1 = require("../utils/cookie");
const token_1 = require("../utils/token");
// Register user
exports.registerUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, password, phone, nid } = req.body;
    if (!name || name.length < 3 || name.length > 20) {
        throw new AppError_1.AppError(400, "Name must be between 3 and 20 characters!");
    }
    if (!email)
        throw new AppError_1.AppError(400, "Email is required!");
    if (!password || password.length < 6) {
        throw new AppError_1.AppError(400, "Password must be at least 6 characters!");
    }
    if (!phone || phone.length !== 11) {
        throw new AppError_1.AppError(400, "Phone number must be 11 digits!");
    }
    if (!nid || nid.length !== 10) {
        throw new AppError_1.AppError(400, "NID must be 10 digits!");
    }
    const existingUser = await user_model_1.User.findOne({ email });
    if (existingUser)
        throw new AppError_1.AppError(400, "User already exists!");
    const activationCode = crypto_1.default.randomBytes(3).toString("hex");
    const user = { name, email, password, phone, nid, activationCode };
    const token = jsonwebtoken_1.default.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: "10m" });
    try {
        // Send activation code to user's email
        await (0, email_1.sendActivationEmail)(email, activationCode);
    }
    catch (error) {
        console.error('Failed to send activation email:', error);
        throw new AppError_1.AppError(500, "Failed to send activation email. Please try again later.");
    }
    res.status(200).json({
        success: true,
        message: "Check your email to activate your account.",
        token,
    });
});
// Activate user
exports.activateUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { activationCode, token } = req.body;
    if (!token)
        throw new AppError_1.AppError(400, "Token is required!");
    if (!activationCode)
        throw new AppError_1.AppError(400, "Activation code is required!");
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
    }
    catch {
        throw new AppError_1.AppError(401, "Token expired or invalid");
    }
    const { name, email, password, phone, nid, activationCode: originalCode } = decoded;
    if (activationCode !== originalCode) {
        throw new AppError_1.AppError(400, "Invalid activation code");
    }
    const userExists = await user_model_1.User.findOne({ email });
    if (userExists) {
        throw new AppError_1.AppError(400, "User already exists!");
    }
    const newUser = new user_model_1.User({ name, email, password, phone, nid, isVerified: true, role: "user" });
    await newUser.save();
    res.status(200).json({ success: true, newUser, message: "User registation successfully!" });
});
// Login user
exports.loginUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    if (!email)
        throw new AppError_1.AppError(400, "Email is required!");
    if (!password || password.length < 6) {
        throw new AppError_1.AppError(400, "Password must be at least 6 characters!");
    }
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new AppError_1.AppError(401, "User not found!");
    if (!password || !user.password)
        throw new AppError_1.AppError(401, "Invalid credentials!");
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch)
        throw new AppError_1.AppError(401, "Invalid credentials!");
    // access token & refresh token generate
    const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
    const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id });
    (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
    const userWithoutPassword = { ...user.toObject(), password: undefined };
    await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    res.status(200).json({ success: true, message: "Login successful" });
});
// Refresh access token
exports.refreshAccessToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token)
        throw new AppError_1.AppError(401, "Refresh token is required Please login again.");
    let decoded;
    try {
        decoded = (0, token_1.verifyRefreshToken)(token);
    }
    catch (error) {
        throw new AppError_1.AppError(401, "Refresh token expired or invalid Please login again.");
    }
    let user = await redis_1.redis.get(decoded.id);
    if (!user) {
        user = await user_model_1.User.findById(decoded.id);
        if (user) {
            const userWithoutPassword = { ...user.toObject(), password: undefined };
            await redis_1.redis.set(decoded.id, JSON.stringify(userWithoutPassword), "EX", 15 * 60);
        }
    }
    else {
        user = JSON.parse(user);
    }
    if (!user)
        throw new AppError_1.AppError(404, "User not found!");
    const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
    // Update Redis cache with fresh user data
    const plainUser = user.toObject ? user.toObject() : user;
    const userWithoutPassword = { ...plainUser, password: undefined };
    await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    (0, cookie_1.setAccessTokenCookie)(res, accessToken);
    res.status(200).json({ success: true, message: "Access token refreshed" });
});
// social auth (google, facebook, github)
exports.socialAuth = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, name, avatar } = req.body;
    const user = await user_model_1.User.findOne({ email });
    if (!user) {
        const newUser = await user_model_1.User.create({ email, name, avatar });
        const accessToken = (0, token_1.generateAccessToken)({ id: newUser._id, role: newUser.role });
        const refreshToken = (0, token_1.generateRefreshToken)({ id: newUser._id });
        (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
        res.status(200).json({ success: true, message: "User created successfully", user: newUser });
    }
    else {
        const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
        const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id });
        (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
        const userWithoutPassword = { ...user.toObject(), password: undefined };
        await redis_1.redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
        res.status(200).json({ success: true, message: "User login successfull!", user });
    }
});
// forget password (OTP based)
exports.forgetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    if (!email)
        throw new AppError_1.AppError(400, "Email is required");
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new AppError_1.AppError(404, "User not found");
    // 6 digit OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = otp;
    user.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expire
    await user.save({ validateBeforeSave: false });
    try {
        await (0, email_1.sendActivationEmail)(email, `Your reset password OTP is: ${otp}`);
    }
    catch (err) {
        // If email sending fails, clear the OTP fields
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error("Failed to send reset email:", err);
        throw new AppError_1.AppError(500, "Failed to send reset OTP. Please try again later.");
    }
    res.status(200).json({
        success: true,
        message: "Password reset OTP sent to your email",
    });
});
// reset password (OTP verify and set new password)
exports.resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
        throw new AppError_1.AppError(400, "OTP and new password are required");
    }
    const user = await user_model_1.User.findOne({
        passwordResetToken: otp,
        passwordResetExpire: { $gt: new Date() },
    });
    if (!user)
        throw new AppError_1.AppError(400, "Invalid or expired OTP");
    // Set new password and clear OTP fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successful" });
});
// logout user
exports.logoutUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    await redis_1.redis.del(req.user._id);
    res.status(200).json({ success: true, message: "Logged out successfully" });
});
// update user profile
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, phone } = req.body;
    const user = await user_model_1.User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
    res.status(200).json({ success: true, message: "Profile updated successfully", user });
});
//# sourceMappingURL=user.controller.js.map