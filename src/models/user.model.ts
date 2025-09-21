import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  otp?: string;
  otpExpire?: Date;
  role: "user" | "admin";
  avatar?: {
    public_id: string;
    url: string;
  };
  passwordResetToken: string;
  passwordResetExpire: Date;
  refreshToken?: string;
  phone?: string;
  nid?: string;
  comparePassword(password: string): Promise<boolean>;
}

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      validate: {
        validator: function (v: string) {
          return emailRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    password: { type: String, required: true, minlength: 6, trim: true },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpire: { type: Date, index: { expires: 300 } }, // OTP expires in 5 minutes
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      public_id: String,
      url: String,
    },
    passwordResetToken: String,
    passwordResetExpire: Date,
    refreshToken: String,
    phone: { type: String, unique: true, sparse: true, minlength: 11, maxlength: 14 },
    nid: { type: String, unique: true, sparse: true, minlength: 10, maxlength: 19 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password.startsWith("$2b$")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
