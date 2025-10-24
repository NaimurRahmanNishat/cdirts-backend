import mongoose, { Schema, Document } from "mongoose";

export enum BangladeshDivision {
  DHAKA = "Dhaka",
  CHATTOGRAM = "Chattogram",
  RAJSHAHI = "Rajshahi",
  KHULNA = "Khulna",
  BARISHAL = "Barishal",
  SYLHET = "Sylhet",
  RANGPUR = "Rangpur",
  MYMENSINGH = "Mymensingh",
}

export enum IssueStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  RESOLVED = "resolved",
}

export enum IssueCategory {
  ELECTRICITY = "electricity",
  WATAR = "watar",
  GAS = "gas",
  BRACKING_ROAD = "bracking-road",
  OTHER = "other",
}

export interface IIssue extends Document {
  title: string;
  category: IssueCategory;
  description: string;
  images: {
    public_id: string;
    url: string;
  }[]; // Array of image objects 
  location: string;
  division: BangladeshDivision;
  status: IssueStatus;
  author: mongoose.Types.ObjectId;
  reviews: mongoose.Types.ObjectId[];
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const issueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(IssueCategory),
      required: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    location: { type: String, required: true, trim: true },
    division: {
      type: String,
      enum: Object.values(BangladeshDivision),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(IssueStatus),
      default: IssueStatus.PENDING,
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// search index
issueSchema.index({ title: "text", description: "text", location: "text" });

export const Issue = mongoose.model<IIssue>("Issue", issueSchema);
