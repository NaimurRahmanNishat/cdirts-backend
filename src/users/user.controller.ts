import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/ResponseHandler";
import User from "./user.model";
import sendEmail from "../utils/sendEmail";
import generateToken from "../middleware/generateToken";
import { Types } from "mongoose";

// user register controller
const userRegister = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone, nidcard } = req.body as {
      username: string;
      email: string;
      password: string;
      phone: string;
      nidcard: string;
    };
    if (!username || !email || !password || !phone || !nidcard) {
      return errorResponse(res, 400, "All fields are required");
    }
    if (username.length < 3 || username.length > 20) {
      return errorResponse(
        res,
        400,
        "Username must be between 3 to 20 characters"
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return errorResponse(res, 400, "Invalid email format");
    }
    if (password.length < 8) {
      return errorResponse(res, 400, "Password must be at least 8 characters");
    }
    if (phone.toString().length !== 11) {
      return errorResponse(res, 400, "Phone number must be 11 digits");
    }
    if (nidcard.toString().length !== 10) {
      return errorResponse(res, 400, "NID card number must be 10 digits");
    }
    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });
    const existingPhone = await User.findOne({ phone });
    const existingNid = await User.findOne({ nidcard });

    if (existingEmail)
      return errorResponse(res, 400, "Email already registered");
    if (existingUsername)
      return errorResponse(res, 400, "Username already taken");
    if (existingPhone)
      return errorResponse(res, 400, "Phone number already registered");
    if (existingNid)
      return errorResponse(res, 400, "NID card already registered");

    try {
      const newUser = await User.create({
        username,
        email,
        password,
        phone,
        nidcard,
        isVerified: false,
      });

      // Generate OTP
      const otpCode = newUser.createOtpCode();
      await newUser.save({ validateBeforeSave: false });

      // Send OTP mail
      await sendEmail(
        newUser.email,
        "Account Verification OTP",
        `Hello ${newUser.username}, your OTP for registration is ${otpCode}. This will expire in 10 minutes.`
      );

      return successResponse(
        res,
        201,
        "OTP sent to email. Please verify to complete registration.",
        {
          email: newUser.email,
        }
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "field";
        return errorResponse(
          res,
          400,
          `User with this ${field} already exists`
        );
      }
      throw error;
    }
  } catch (error) {
    console.error(error);
    errorResponse(res, 500, "User registration failed");
  }
};

// Verify Registration OTP controller
const verifyRegisterOtp = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body as { email?: string; otpCode?: string };
    if (!email || !otpCode) {
      return errorResponse(res, 400, "Email and OTP are required");
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+otpCode +otpExpire"); 

    if (!user) return errorResponse(res, 404, "User not found");

    // OTP check
    const isValidOtp = user.verifyOtpCode(otpCode);
    if (!isValidOtp) return errorResponse(res, 400, "Invalid or expired OTP");

    //  Activate user
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return successResponse(
      res,
      200,
      "Account verified successfully! You can now login.",
      {
        id: user._id,
        username: user.username,
        email: user.email,
      }
    );
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return errorResponse(res, 500, error?.message || "Something went wrong");
  }
};

// Login (Step 1: check password, send OTP) controller
const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email) return errorResponse(res, 400, "Email is required");
    if (!password) return errorResponse(res, 400, "Password is required");

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password +otpCode +otpExpire"
    );
    if (!user) return errorResponse(res, 404, "User not found");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return errorResponse(res, 401, "Invalid password");

    // Generate & save OTP
    const otpCode = user.createOtpCode();
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    await sendEmail(user.email, "Your OTP Code", `Your OTP code is: ${otpCode}`);

    return successResponse(res, 200, "OTP sent to email. Please verify.", {
      requiresOtp: true,
      email: user.email,
    });
  } catch (error: any) {
    return errorResponse(res, 500, error?.message || "Something went wrong", error);
  }
};

// Verify OTP (Step 2) controller
const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otpCode } = req.body as { email?: string; otpCode?: string };
    if (!email || !otpCode) {
      return errorResponse(res, 400, "Email and OTP are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire"
    );
    if (!user) return errorResponse(res, 404, "User not found");

    const isValidOtp = user.verifyOtpCode(otpCode);
    if (!isValidOtp) return errorResponse(res, 400, "Invalid or expired OTP");

    // Clear OTP after successful verification
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // JWT
    const token = await generateToken((user._id as Types.ObjectId).toString());

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd, // only secure in prod
      sameSite: isProd ? "none" : "lax",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return successResponse(res, 200, "Login successful", {
      token,
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error: any) {
    return errorResponse(res, 500, error?.message || "Something went wrong", error);
  }
};

//  resend login otp controller
const resendLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      return errorResponse(res, 400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire +otpRequestedAt"
    );

    if (!user) return errorResponse(res, 404, "User not found");

    const now = new Date();
    const cooldownTime = 60 * 1000; // 1 minute cooldown
    if (user.otpRequestedAt && now.getTime() - user.otpRequestedAt.getTime() < cooldownTime) {
      const waitSeconds = Math.ceil(
        (cooldownTime - (now.getTime() - user.otpRequestedAt.getTime())) / 1000
      );
      return errorResponse(
        res,
        429,
        `Please wait ${waitSeconds} seconds before requesting a new OTP`
      );
    }

    const otpCode = user.createOtpCode();
    user.otpRequestedAt = now;
    await user.save({ validateBeforeSave: false });

    await sendEmail(
      user.email,
      "Your New OTP Code",
      `Hello ${user.username}, your new OTP is ${otpCode}. This OTP will expire in 10 minutes.`
    );

    return successResponse(res, 200, "A new OTP has been sent to your email", {
      email: user.email,
    });
  } catch (error: any) {
    return errorResponse(res, 500, error?.message || "Failed to resend OTP!", error);
  }
};

// Forgot password (send OTP) controller
const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return errorResponse(res, 400, "Email is required");

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire"
    );
    if (!user) return errorResponse(res, 404, "User not found");

    const otp = user.createOtpCode();
    await user.save({ validateBeforeSave: false });

    const message = `Hello ${user.username}, Your OTP for password reset is ${otp}. This OTP will expire in 10 minutes. Regards, Cineflix`;
    await sendEmail(user.email, "Password Reset OTP", message);

    return successResponse(res, 200, "OTP sent to your email successfully!");
  } catch (error: any) {
    return errorResponse(res, 500, "Failed to send OTP!", error);
  }
};

// Reset password (with OTP) controller
const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otpCode, newPassword } = req.body as {
      email?: string;
      otpCode?: string;
      newPassword?: string;
    };

    if (!email || !otpCode || !newPassword) {
      return errorResponse(res, 400, "Email, OTP and New Password are required!");
    }
    if (newPassword.length < 6) {
      return errorResponse(res, 400, "New password must be at least 6 characters");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+otpCode +otpExpire +password"
    );
    if (!user) return errorResponse(res, 404, "User not found!");

    const isValidOtp = user.verifyOtpCode(otpCode);
    if (!isValidOtp) return errorResponse(res, 400, "Invalid or expired OTP!");

    // Set new password; pre('save') will hash & update passwordChangedAt
    user.password = newPassword;

    // Clear OTP after use
    user.otpCode = undefined;
    user.otpExpire = undefined;

    await user.save();

    return successResponse(res, 200, "Password reset successful!");
  } catch (error: any) {
    return errorResponse(res, 500, "Failed to reset password!", error);
  }
};

// Logout controller
const userLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax", 
      secure: process.env.NODE_ENV === "production", 
    });
    successResponse(res, 200, "Logout successful!");
  } catch (error) {
    console.error("Logout error:", error);
    errorResponse(res, 500, "Logout failed!");
  }
}

// get all user controller (only admin) controller
const getAllUser = async (req:Request, res:Response) =>{
  try {
    const users = await User.find({}, "email role").sort({createdAt:-1})
    successResponse(res, 200, "All users fetch successfully!", users);
  } catch (error:any) {
    errorResponse(res, 500, "Faild to fetch all users!")
  }
}

// user delete controller (only admin) controller
const userDelete = async (req:Request, res:Response) =>{
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if(!user){
      errorResponse(res, 404, "user not found!");
      return;
    }
    successResponse(res, 200, "user deleted successfully!");
  } catch (error:any) {
    errorResponse(res, 500, "Faild to delete user!");
  }
}

// edit user profile controller
const editUserProfile = async (req:Request, res:Response) => {
  const { id } = req.params;
  const { username, profileImage, bio, profession } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, profileImage, bio, profession },
      { new: true }
    )
    if(!updatedUser){
      errorResponse(res, 404, "User not found!");
      return;
    }
    successResponse(res, 200, "User profile updated successfully!", {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
      bio: updatedUser.bio,
      profession: updatedUser.profession,
    });
  } catch (error:any) {
    errorResponse(res, 500, "Faild to update user!");
  }
}

export { userRegister, verifyRegisterOtp, userLogin, verifyOtp, resendLoginOtp, forgotPassword, resetPassword, userLogout, getAllUser, userDelete, editUserProfile };
