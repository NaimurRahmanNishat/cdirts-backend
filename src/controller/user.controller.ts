import { Request, Response } from "express";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../middleware/catchAsync";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendActivationEmail } from "../utils/email";
import bcrypt from "bcrypt";
import { redis } from "../utils/redis";
import { setAccessTokenCookie, setAuthCookies } from "../utils/cookie";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token";
import { AuthRequest } from "../middleware/auth";


// Register user
export const registerUser = catchAsync(async (req: Request, res:Response) => {
    const {name, email, password, phone, nid} = req.body;
    const existingUser = await User.findOne({email});
    if(existingUser) throw new AppError(400, "User already exists!");

    const activationCode = crypto.randomBytes(3).toString("hex");
    const user = { name, email, password, phone, nid, activationCode }

    const token = jwt.sign( user, process.env.JWT_ACCESS_SECRET!, { expiresIn: "10m" });

    try {
        // Send activation code to user's email
        await sendActivationEmail(email, activationCode);
    } catch (error) {
        console.error('Failed to send activation email:', error);
        throw new AppError(500, "Failed to send activation email. Please try again later.");
    }

    res.status(200).json({
    success: true,
    message: "Check your email to activate your account.",
    token,
  });
});

// Activate user
export const activateUser = catchAsync(async (req: Request, res:Response) => {
    const { activationCode, token } = req.body;
    if(!token) throw new AppError(400, "Token is required!");
    if(!activationCode) throw new AppError(400, "Activation code is required!");

    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    } catch {
        throw new AppError(401, "Token expired or invalid");
    }
    const { name, email, password, phone, nid, activationCode: originalCode } = decoded;

    if (activationCode !== originalCode) {
        throw new AppError(400, "Invalid activation code");
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new AppError(400, "User already exists!");
    }
    const newUser = new User({ name, email, password, phone, nid, isVerified: true, role: "user" });
    await newUser.save();
    res.status(200).json({ success: true, newUser, message: "User registered successfully!" });
});

// Login user
export const loginUser = catchAsync(async (req: Request, res:Response) => {
    const { email, password } = req.body;
    if(!email || !password) throw new AppError(400, "Email and password are required!");
    const user = await User.findOne({ email });
    if(!user) throw new AppError(401, "User not found!");
    if(!password || !user.password) throw new AppError(401, "Invalid credentials!");
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) throw new AppError(401, "Invalid credentials!");
    
    // access token & refresh token generate
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    setAuthCookies(res, accessToken, refreshToken);

    const userWithoutPassword = { ...user.toObject(), password: undefined };
    await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);

    res.status(200).json({ success: true, message: "Login successful" });
})

// Refresh access token
export const refreshAccessToken = catchAsync(async (req: Request, res:Response) => {
    const token = req.cookies.refreshToken;
    if(!token) throw new AppError(401, "Refresh token is required Please login again.");

    let decoded: any;
    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {
        throw new AppError(401, "Refresh token expired or invalid Please login again.");
    }
    let user: any = await redis.get(decoded.id);
    if(!user){
        user = await User.findById(decoded.id);
        if(user){
            const userWithoutPassword = { ...user.toObject(), password: undefined };
            await redis.set(decoded.id, JSON.stringify(userWithoutPassword), "EX", 15 * 60);
        }
    }else{
        user = JSON.parse(user);
    }
    if(!user) throw new AppError(404, "User not found!");
    
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    // Update Redis cache with fresh user data
    const plainUser = user.toObject ? user.toObject() : user;
    const userWithoutPassword = { ...plainUser, password: undefined };
    await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    setAccessTokenCookie(res, accessToken);

    res.status(200).json({ success: true, message: "Access token refreshed" });
});

// social auth (google, facebook, github)
export const socialAuth = catchAsync(async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    const newUser = await User.create({ email, name, avatar });
    const accessToken = generateAccessToken({ id: newUser._id, role: newUser.role });
    const refreshToken = generateRefreshToken({ id: newUser._id });
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({ success: true, message: "User created successfully", user: newUser});
  } else {
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });
    setAuthCookies(res, accessToken, refreshToken);
    const userWithoutPassword = { ...user.toObject(), password: undefined };
    await redis.set(user._id.toString(), JSON.stringify(userWithoutPassword), "EX", 15 * 60);
    res.status(200).json({ success: true, message: "User login successfull!", user });
  }
});

// forget password (OTP based)
export const forgetPassword = catchAsync(async (req: Request, res: Response) => {
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
    await sendActivationEmail(
      email,
      `Your reset password OTP is: ${otp}`
    );
  } catch (err) {
    // If email sending fails, clear the OTP fields
    user.passwordResetToken = undefined!;
    user.passwordResetExpire = undefined!;
    await user.save({ validateBeforeSave: false });
    console.error("Failed to send reset email:", err);
    throw new AppError(500, "Failed to send reset OTP. Please try again later.");
  }

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your email",
  });
});

// reset password (OTP verify and set new password)
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

  // Set new password and clear OTP fields
  user.password = newPassword;
  user.passwordResetToken = undefined!;
  user.passwordResetExpire = undefined!;
  await user.save();

  res.status(200).json({ success: true, message: "Password reset successful" });
});

// logout user
export const logoutUser = catchAsync(async (req: AuthRequest, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  await redis.del(req.user!._id as string);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// update user profile
export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user!._id, { name, phone }, { new: true });
  res.status(200).json({ success: true, message: "Profile updated successfully", user });
});

