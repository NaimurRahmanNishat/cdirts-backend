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
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_1 = require("../utils/email");
const redis_1 = require("../utils/redis");
const cookie_1 = require("../utils/cookie");
const token_1 = require("../utils/token");
const authState_1 = require("../middleware/authState");
// Register user (send activation email)
exports.registerUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, password, phone, nid } = req.body;
    // Validation
    if (!name || name.length < 3 || name.length > 20) {
        throw new AppError_1.AppError(400, "Name must be between 3 and 20 characters!");
    }
    if (!email)
        throw new AppError_1.AppError(400, "Email is required!");
    if (!password || password.length < 6) {
        throw new AppError_1.AppError(400, "Password must be at least 6 characters!");
    }
    if (!phone || !user_model_1.phoneRegex.test(phone)) {
        throw new AppError_1.AppError(400, "Please provide a valid Bangladesh phone number!");
    }
    if (!nid || !user_model_1.nidRegex.test(nid)) {
        throw new AppError_1.AppError(400, "Please provide a valid Bangladesh NID number!");
    }
    const existingUser = await user_model_1.User.findOne({ email });
    if (existingUser)
        throw new AppError_1.AppError(400, "User already exists!");
    const activationCode = crypto_1.default.randomBytes(3).toString("hex");
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const activationData = { name, email, phone, nid, activationCode };
    // Save hashed password temporarily in Redis for 10 minutes
    await redis_1.redis.set(`activation:${email}`, hashedPassword, "EX", 600);
    const token = jsonwebtoken_1.default.sign(activationData, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "10m",
    });
    try {
        await (0, email_1.sendActivationEmail)(email, activationCode);
    }
    catch (error) {
        console.error("Failed to send activation email:", error);
        // cleanup redis
        await redis_1.redis.del(`activation:${email}`);
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
    const { name, email, phone, nid, activationCode: originalCode } = decoded;
    if (activationCode !== originalCode) {
        throw new AppError_1.AppError(400, "Invalid activation code");
    }
    const userExists = await user_model_1.User.findOne({ email });
    if (userExists) {
        throw new AppError_1.AppError(400, "User already exists!");
    }
    const hashedPassword = await redis_1.redis.get(`activation:${email}`);
    if (!hashedPassword)
        throw new AppError_1.AppError(400, "Activation time expired. Please register again.");
    const newUser = new user_model_1.User({
        name,
        email,
        password: hashedPassword,
        phone,
        nid,
        isVerified: true,
        role: "user",
    });
    await newUser.save();
    await redis_1.redis.del(`activation:${email}`);
    res.status(200).json({ success: true, newUser, message: "User registration successful!" });
});
// Login user
exports.loginUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    if (!email)
        throw new AppError_1.AppError(400, "Email is required!");
    if (!password || password.length < 6) {
        throw new AppError_1.AppError(400, "Password must be at least 6 characters!");
    }
    // password field is select:false in model -> select it explicitly
    const user = await user_model_1.User.findOne({ email }).select("+password");
    if (!user)
        throw new AppError_1.AppError(401, "User not found!");
    if (!user.password)
        throw new AppError_1.AppError(401, "Invalid credentials!");
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch)
        throw new AppError_1.AppError(401, "Invalid credentials!");
    const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
    const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id });
    // Store refresh token in Redis
    await redis_1.redis.set(`refresh_token:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7 days
    (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
    // Safe user data
    const safeUser = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
    };
    // Use setUserState helper for consistency (ttl 15 minutes)
    await (0, authState_1.setUserState)(user._id.toString(), safeUser);
    res.status(200).json({
        success: true,
        message: `${user.role} logged in successfully`,
        data: safeUser,
    });
});
// Refresh access token
exports.refreshAccessToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token)
        throw new AppError_1.AppError(401, "Refresh token is required. Please login again.");
    let decoded;
    try {
        decoded = (0, token_1.verifyRefreshToken)(token);
    }
    catch (error) {
        throw new AppError_1.AppError(401, "Refresh token expired or invalid. Please login again.");
    }
    // Verify refresh token against Redis
    const storedRefreshToken = await redis_1.redis.get(`refresh_token:${decoded.id}`);
    if (!storedRefreshToken || storedRefreshToken !== token) {
        throw new AppError_1.AppError(401, "Invalid refresh token. Please login again.");
    }
    // Get user data (cache-first)
    let cached = await (async () => {
        try {
            return await redis_1.redis.get(`userState:${decoded.id}`);
        }
        catch {
            return null;
        }
    })();
    let user;
    if (!cached) {
        user = await user_model_1.User.findById(decoded.id).select("-password").lean();
        if (!user)
            throw new AppError_1.AppError(404, "User not found!");
        await (0, authState_1.setUserState)(decoded.id, user);
    }
    else {
        user = JSON.parse(cached);
    }
    const safeUser = {
        _id: user._id ? user._id.toString() : decoded.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
    };
    await (0, authState_1.setUserState)(decoded.id, safeUser);
    const accessToken = (0, token_1.generateAccessToken)({ id: decoded.id, role: user.role });
    (0, cookie_1.setAccessTokenCookie)(res, accessToken);
    res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        data: safeUser
    });
});
// Social auth
exports.socialAuth = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, name, avatar } = req.body;
    if (!email)
        throw new AppError_1.AppError(400, "Email is required for social auth");
    let user = await user_model_1.User.findOne({ email });
    if (!user) {
        // create user (no password)
        user = await user_model_1.User.create({ email, name, avatar, isVerified: true });
    }
    const accessToken = (0, token_1.generateAccessToken)({ id: user._id, role: user.role });
    const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id });
    // Store refresh token in Redis (not DB)
    await redis_1.redis.set(`refresh_token:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
    const userWithoutPassword = { _id: user._id.toString(), name: user.name, email: user.email, role: user.role, isVerified: user.isVerified };
    await (0, authState_1.setUserState)(user._id.toString(), userWithoutPassword);
    res.status(200).json({
        success: true,
        message: user.isNew ? "User created successfully" : "User login successful",
        data: userWithoutPassword,
    });
});
// Forget password (OTP based)
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
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save({ validateBeforeSave: false });
        console.error("Failed to send reset email:", err);
        throw new AppError_1.AppError(500, "Failed to send reset OTP. Please try again later.");
    }
    res.status(200).json({ success: true, message: "Password reset OTP sent to your email" });
});
// Reset password
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
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successful" });
});
// Logout user
exports.logoutUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?._id;
    if (userId) {
        // Redis থেকে refresh token AND user state delete করুন
        await redis_1.redis.del(`refresh_token:${userId}`);
        await (0, authState_1.deleteUserState)(userId.toString());
    }
    // Cookies clear (explicit options to match set cookie)
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully" });
});
// Update user profile
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, phone } = req.body;
    if (phone && !user_model_1.phoneRegex.test(phone)) {
        throw new AppError_1.AppError(400, "Please provide a valid Bangladesh phone number!");
    }
    const user = await user_model_1.User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true, runValidators: true }).select("-password");
    // Update cache
    if (user) {
        const cachedUser = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            ...(user.phone && { phone: user.phone }),
        };
        await (0, authState_1.setUserState)(user._id.toString(), cachedUser);
    }
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user,
    });
});
//# sourceMappingURL=user.controller.js.map