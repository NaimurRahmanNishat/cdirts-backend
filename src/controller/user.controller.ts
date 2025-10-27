import { Request, Response } from "express";
import { nidRegex, phoneRegex, User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../middleware/catchAsync";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendActivationEmail } from "../utils/email";
import { redis } from "../utils/redis";
import { setAccessTokenCookie, setAuthCookies } from "../utils/cookie";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token";
import { AuthRequest } from "../middleware/auth";
import { deleteUserState, setUserState } from "../middleware/authState";

// Register user (send activation email)
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone, nid } = req.body;

  // Validation
  if (!name || name.length < 3 || name.length > 20) {
    throw new AppError(400, "Name must be between 3 and 20 characters!");
  }
  if (!email) throw new AppError(400, "Email is required!");
  if (!password || password.length < 6) {
    throw new AppError(400, "Password must be at least 6 characters!");
  }
  if (!phone || !phoneRegex.test(phone)) {
    throw new AppError(400, "Please provide a valid Bangladesh phone number!");
  }
  if (!nid || !nidRegex.test(nid)) {
    throw new AppError(400, "Please provide a valid Bangladesh NID number!");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError(400, "User already exists!");

  const activationCode = crypto.randomBytes(3).toString("hex");
  const hashedPassword = await bcrypt.hash(password, 10);

  const activationData = { name, email, phone, nid, activationCode };

  // Save hashed password temporarily in Redis for 10 minutes
  await redis.set(email, hashedPassword, "EX", 600);

  const token = jwt.sign(activationData, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "10m",
  });

  try {
    await sendActivationEmail(email, activationCode);
  } catch (error) {
    console.error("Failed to send activation email:", error);
    throw new AppError(
      500,
      "Failed to send activation email. Please try again later."
    );
  }

  res
    .status(200)
    .json({
      success: true,
      message: "Check your email to activate your account.",
      token,
    });
});

// Activate user
export const activateUser = catchAsync(async (req: Request, res: Response) => {
  const { activationCode, token } = req.body;
  if (!token) throw new AppError(400, "Token is required!");
  if (!activationCode) throw new AppError(400, "Activation code is required!");

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
  } catch {
    throw new AppError(401, "Token expired or invalid");
  }

  const { name, email, phone, nid, activationCode: originalCode } = decoded;

  if (activationCode !== originalCode) {
    throw new AppError(400, "Invalid activation code");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError(400, "User already exists!");
  }

  const hashedPassword = await redis.get(email);
  if (!hashedPassword)
    throw new AppError(400, "Activation time expired. Please register again.");

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    phone,
    nid,
    isVerified: true,
    role: "user",
  });
  await newUser.save();

  await redis.del(email);

  res
    .status(200)
    .json({ success: true, newUser, message: "User registration successful!" });
});

// Login user
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) throw new AppError(400, "Email is required!");
  if (!password || password.length < 6) {
    throw new AppError(400, "Password must be at least 6 characters!");
  }

  const user = await User.findOne({ email });
  if (!user) throw new AppError(401, "User not found!");
  if (!user.password) throw new AppError(401, "Invalid credentials!");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError(401, "Invalid credentials!");

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Redis-এ refresh token store করুন
  await redis.set(
    `refresh_token:${user._id}`, 
    refreshToken, 
    "EX", 
    7 * 24 * 60 * 60 // 7 days
  );

  setAuthCookies(res, accessToken, refreshToken);

  // Safe user data
  const safeUser = {
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  // Redis-এ user data store করুন
  await redis.set(user._id.toString(), JSON.stringify(safeUser), "EX", 15 * 60);
  
  res.status(200).json({
    success: true,
    message: `${user.role} logged in successfully`,
    data: safeUser,
  });
});

// Refresh access token
export const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError(401, "Refresh token is required. Please login again.");

  let decoded: any;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new AppError(401, "Refresh token expired or invalid. Please login again.");
  }

  // Redis থেকে refresh token verify করুন
  const storedRefreshToken = await redis.get(`refresh_token:${decoded.id}`);
  
  if (!storedRefreshToken || storedRefreshToken !== token) {
    throw new AppError(401, "Invalid refresh token. Please login again.");
  }

  // Redis থেকে user data আনুন
  let userData = await redis.get(decoded.id);
  let user;
  
  if (!userData) {
    user = await User.findById(decoded.id);
    if (!user) throw new AppError(404, "User not found!");
  } else {
    user = JSON.parse(userData);
  }

  // Safe user data
  const safeUser = {
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };

  // Redis-এ user data আপডেট করুন
  await redis.set(decoded.id, JSON.stringify(safeUser), "EX", 15 * 60);

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  setAccessTokenCookie(res, accessToken);

  res.status(200).json({ 
    success: true, 
    message: "Access token refreshed successfully",
    data: safeUser
  });
});

// Social auth
export const socialAuth = catchAsync(async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email, name, avatar, isVerified: true });
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });
  await User.findByIdAndUpdate(user._id, { refreshToken });

  setAuthCookies(res, accessToken, refreshToken);

  const userWithoutPassword = { ...user.toObject(), password: undefined };
  await redis.set(
    `user:${user._id}`,
    JSON.stringify(userWithoutPassword),
    "EX",
    15 * 60
  );

  res.status(200).json({
    success: true,
    message: user.isNew ? "User created successfully" : "User login successful",
    data: userWithoutPassword,
  });
});

// Forget password (OTP based)
export const forgetPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) throw new AppError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) throw new AppError(404, "User not found");

    // 6 digit OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.passwordResetToken = otp;
    user.passwordResetExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expire
    await user.save({ validateBeforeSave: false });

    try {
      await sendActivationEmail(email, `Your reset password OTP is: ${otp}`);
    } catch (err) {
      // If email sending fails, clear the OTP fields
      user.passwordResetToken = undefined!;
      user.passwordResetExpire = undefined!;
      await user.save({ validateBeforeSave: false });
      console.error("Failed to send reset email:", err);
      throw new AppError(
        500,
        "Failed to send reset OTP. Please try again later."
      );
    }

    res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  }
);

// Reset password
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { otp, newPassword } = req.body;
  if (!otp || !newPassword) {
    throw new AppError(400, "OTP and new password are required");
  }

  const user = await User.findOne({
    passwordResetToken: otp,
    passwordResetExpire: { $gt: new Date() },
  });

  if (!user) throw new AppError(400, "Invalid or expired OTP");

  user.password = newPassword;
  user.passwordResetToken = undefined!;
  user.passwordResetExpire = undefined!;
  await user.save();

  res.status(200).json({ success: true, message: "Password reset successful" });
});

// Logout user
export const logoutUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?._id;
  
  if (userId) {
    // Redis থেকে refresh token AND user data delete করুন
    await redis.del(`refresh_token:${userId}`);
    await redis.del(userId.toString());
    
    // authState থেকেও user data delete করুন
    await deleteUserState(userId.toString());
  }

  // Cookies clear 
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  
  res.status(200).json({ 
    success: true, 
    message: "Logged out successfully" 
  });
}); 

// Update user profile
export const updateProfile = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { name, phone } = req.body;

    if (phone && !phoneRegex.test(phone)) {
      throw new AppError(
        400,
        "Please provide a valid Bangladesh phone number!"
      );
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { name, phone },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  }
);
