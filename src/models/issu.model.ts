import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  title: string;
  description: string;
  image?: {
    public_id: string;
    url: string;
  };
  location?: string;
  status: "pending" | "in-progress" | "resolved";
  createdBy: mongoose.Types.ObjectId; // user reference
  phone: string; // পোস্ট করার সময় দেওয়া নাম্বার
  otpCode?: string; // 6 digit OTP
  otpExpire?: Date; // OTP expiration time
  verified: boolean; // OTP ভেরিফাই হয়েছে কি না
}

const issueSchema = new Schema<IIssue>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  image: {
    public_id: { type: String },
    url: { type: String },
  },
  location: { type: String },
  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved"],
    default: "pending",
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  phone: { type: String, required: true },
  otpCode: { type: String },
  otpExpire: { type: Date },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

export const Issue = mongoose.model<IIssue>("Issue", issueSchema);
