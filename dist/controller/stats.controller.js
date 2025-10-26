"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStats = exports.userStats = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const AppError_1 = require("../utils/AppError");
const user_model_1 = require("../models/user.model");
const issue_model_1 = require("../models/issue.model");
const review_model_1 = require("../models/review.model");
// Get user stats
exports.userStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email } = req.params;
    if (!email)
        throw new AppError_1.AppError(400, "Email is required!");
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new AppError_1.AppError(404, "User not found!");
    // Total issues created by this user
    const totalIssues = await issue_model_1.Issue.countDocuments({ author: user._id });
    // Total reviews & comments (including replies)
    const userReviews = await review_model_1.Review.find({ author: user._id });
    const totalReviews = userReviews.length;
    let totalReplies = 0;
    userReviews.forEach((review) => {
        totalReplies += review.replies.length;
    });
    const totalReviewAndComment = totalReviews + totalReplies;
    // Issues by status
    const totalPending = await issue_model_1.Issue.countDocuments({
        author: user._id,
        status: "pending",
    });
    const totalInProgress = await issue_model_1.Issue.countDocuments({
        author: user._id,
        status: "in-progress",
    });
    const totalSolved = await issue_model_1.Issue.countDocuments({
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
exports.adminStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // Total issues count
    const totalIssues = await issue_model_1.Issue.countDocuments();
    // Count issues by status
    const pendingIssues = await issue_model_1.Issue.countDocuments({ status: "pending" });
    const inProgressIssues = await issue_model_1.Issue.countDocuments({ status: "in-progress" });
    const solvedIssues = await issue_model_1.Issue.countDocuments({ status: "solved" });
    // Monthly issues (for the current year)
    const currentYear = new Date().getFullYear();
    const monthlyIssuesAggregation = await issue_model_1.Issue.aggregate([
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
//# sourceMappingURL=stats.controller.js.map