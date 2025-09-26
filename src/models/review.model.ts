import mongoose, { Schema, Document } from "mongoose";

export interface IReply {
  author: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
}

export interface IReview extends Document {
  author: mongoose.Types.ObjectId;
  comment: string;
  createdAt: Date;
  replies: IReply[];
}

const replySchema = new Schema<IReply>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const reviewSchema = new Schema<IReview>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema],
});

export const Review = mongoose.model<IReview>("Review", reviewSchema);
