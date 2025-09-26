import { Request, Response } from "express";
import { catchAsync } from "../middleware/catchAsync";
import { Review } from "../models/review.model";
import { Issue } from "../models/issu.model";

// Review create
export const createReview = catchAsync(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const { author, comment } = req.body;

  if (!issueId || !author || !comment) {
    throw new Error("Issue ID, author, and comment are required");
  }

  // Review তৈরি
  const newReview = await Review.create({
    issue: issueId,
    author,
    comment,
  });

  // Issue এর সাথে Review লিংক
  await Issue.findByIdAndUpdate(issueId, { $push: { reviews: newReview._id } });

  res.status(201).json({
    success: true,
    message: "Review added successfully!",
    review: newReview,
  });
});

// Reply create
export const addReplyToReview = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { author, comment } = req.body;

  if (!reviewId || !author || !comment) {
    throw new Error("Review ID, author, and comment are required");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  review.replies.push({ author, comment, createdAt: new Date() });
  await review.save();

  res.status(201).json({
    success: true,
    message: "Reply added successfully!",
    review,
  });
});

