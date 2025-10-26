import { Request, Response } from "express";
import { catchAsync } from "../middleware/catchAsync";
import { AppError } from "../utils/AppError";
import { User } from "../models/user.model";
import { Issue } from "../models/issue.model";
import { Review } from "../models/review.model";

// Get user stats
export const userStats = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  if (!email) throw new AppError(400, "Email is required!");

  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, "User not found!");

  // Total issues created by this user
  const totalIssues = await Issue.countDocuments({ author: user._id });

  // Total reviews & comments (including replies)
  const userReviews = await Review.find({ author: user._id });
  const totalReviews = userReviews.length;
  let totalReplies = 0;
  userReviews.forEach((review) => {
    totalReplies += review.replies.length;
  });
  const totalReviewAndComment = totalReviews + totalReplies;

  // Issues by status
  const totalPending = await Issue.countDocuments({
    author: user._id,
    status: "pending",
  });
  const totalInProgress = await Issue.countDocuments({
    author: user._id,
    status: "in-progress",
  });
  const totalSolved = await Issue.countDocuments({
    author: user._id,
    status: "solved",
  });

  res.status(200).json({
    success: true,
    message: "User stats fetched successfully!",
    data: {
      totalIssues,
      totalReviewAndComment,
      totalSolved,
      totalPending,
      totalInProgress,
    },
  });
});

// Get admin stats
export const adminStats = catchAsync(async (req: Request, res: Response) => {
  // Total issues count
  const totalIssues = await Issue.countDocuments();

  // Count issues by status
  const pendingIssues = await Issue.countDocuments({ status: "pending" });
  const inProgressIssues = await Issue.countDocuments({ status: "in-progress" });
  const solvedIssues = await Issue.countDocuments({ status: "solved" });

  // Monthly issues (for the current year)
  const currentYear = new Date().getFullYear();
  const monthlyIssuesAggregation = await Issue.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" }, // month number 1-12
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  // Transform aggregation to array of 12 months
  const monthlyPostIssue = Array(12)
    .fill(0)
    .map((_, idx) => {
      const monthData = monthlyIssuesAggregation.find((m) => m._id === idx + 1);
      return { month: idx + 1, count: monthData ? monthData.count : 0 };
    });

  res.status(200).json({
    success: true,
    message: "Admin stats fetched successfully!",
    data: {
      totalIssues,
      pendingIssues,
      inProgressIssues,
      solvedIssues,
      monthlyPostIssue,
    },
  });
});
