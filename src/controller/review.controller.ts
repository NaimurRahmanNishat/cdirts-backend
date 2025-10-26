import { Request, Response } from "express";
import { catchAsync } from "../middleware/catchAsync";
import { Review } from "../models/review.model";
import { Issue } from "../models/issue.model";
import { AppError } from "../utils/AppError";

// Create a review
export const createReview = catchAsync(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const { author, comment } = req.body;

  if (!issueId || !author || !comment) {
    throw new AppError(400, "Issue ID, author, and comment are required!");
  }

  const issue = await Issue.findById(issueId);
  if (!issue) throw new AppError(404, "Issue not found!");

  const newReview = await Review.create({
    issue: issueId,
    author,
    comment,
  });

  await Issue.findByIdAndUpdate(issueId, { $push: { reviews: newReview._id } });

  res.status(201).json({
    success: true,
    message: "Review added successfully!",
    data: newReview,
  });
});

// Add reply to a review
export const addReplyToReview = catchAsync(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { author, comment } = req.body;

  if (!reviewId || !author || !comment) {
    throw new AppError(400, "Review ID, author, and comment are required!");
  }

  const review = await Review.findById(reviewId);
  if (!review) throw new AppError(404, "Review not found!");

  review.replies.push({ author, comment, createdAt: new Date() });
  await review.save();

  res.status(201).json({
    success: true,
    message: "Reply added successfully!",
    data: review,
  });
});
