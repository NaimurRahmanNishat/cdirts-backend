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
  SOLVED = "solved",
}

export enum IssueCategory {
  ELECTRICITY = "electricity",
  WATER = "water",
  GAS = "gas",
  BROKEN_ROAD = "broken-road",
  OTHER = "other",
}

export interface IIssue extends Document {
  title: string;
  category: IssueCategory;
  description: string;
  images: {
    public_id: string;
    url: string;
  }[];
  location: string;
  division: BangladeshDivision;
  status: IssueStatus;
  author: mongoose.Types.ObjectId;
  reviews: mongoose.Types.ObjectId[];
  date: Date;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const issueSchema = new Schema<IIssue>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
    },
    category: {
      type: String,
      enum: Object.values(IssueCategory),
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    images: [
      {
        public_id: { type: String },
        url: { type: String, required: true },
      },
    ],
    location: { type: String, required: [true, "Location is required"], trim: true },
    division: {
      type: String,
      enum: Object.values(BangladeshDivision),
      required: [true, "Division is required"],
    },
    status: {
      type: String,
      enum: Object.values(IssueStatus),
      default: IssueStatus.PENDING,
    },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    date: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Full-text search index
issueSchema.index({ title: "text", category: "text", description: "text", location: "text" });

export const Issue = mongoose.model<IIssue>("Issue", issueSchema);
