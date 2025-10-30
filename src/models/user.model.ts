import mongoose from "mongoose";
import bcrypt from "bcrypt";

export type Role = "user" | "categoryadmin" | "admin";

// User Interface
export interface IUser extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  otp?: string;
  otpExpire?: Date;
  role: Role;
  avatar?: {
    public_id: string;
    url: string;
  };
  passwordResetToken?: string;
  passwordResetExpire?: Date;
  // Refresh token handled in Redis (no longer in DB)
  phone?: string;
  nid?: string;
  comparePassword(password: string): Promise<boolean>;
}

// Regex (Bangladesh specific)
export const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
export const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
export const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [20, "Name cannot exceed 20 characters"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      validate: {
        validator: (v: string) => emailRegex.test(v),
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
      select: false, // prevent returning password in queries
    },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpire: Date,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      public_id: { type: String, default: "default_avatar" },
      url: {
        type: String,
        default: "https://res.cloudinary.com/demo/image/upload/v1710000000/default-avatar.png",
      },
    },
    passwordResetToken: String,
    passwordResetExpire: Date,
    phone: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: (v: string) => !v || phoneRegex.test(v),
        message: "Please provide a valid Bangladesh phone number",
      },
    },
    nid: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: (v: string) => !v || nidRegex.test(v),
        message: "Please provide a valid Bangladesh NID number",
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password.startsWith("$2")) return next(); // already hashed
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
