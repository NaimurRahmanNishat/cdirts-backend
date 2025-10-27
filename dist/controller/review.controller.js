"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReplyToReview = exports.createReview = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const review_model_1 = require("../models/review.model");
const issue_model_1 = require("../models/issue.model");
const AppError_1 = require("../utils/AppError");
// Create a review (authenticated user)
exports.createReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const { comment } = req.body;
    const author = req.user?._id;
    if (!issueId || !author || !comment) {
        throw new AppError_1.AppError(400, "Issue ID and comment are required!");
    }
    const issue = await issue_model_1.Issue.findById(issueId);
    if (!issue)
        throw new AppError_1.AppError(404, "Issue not found!");
    const newReview = await review_model_1.Review.create({
        issue: issueId,
        author,
        comment,
    });
    await issue_model_1.Issue.findByIdAndUpdate(issueId, { $push: { reviews: newReview._id } });
    res.status(201).json({ success: true, message: "Review added successfully!", data: newReview });
});
// Add reply to a review (authenticated user)
exports.addReplyToReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const author = req.user?._id;
    if (!reviewId || !author || !comment) {
        throw new AppError_1.AppError(400, "Review ID and comment are required!");
    }
    const review = await review_model_1.Review.findById(reviewId);
    if (!review)
        throw new AppError_1.AppError(404, "Review not found!");
    review.replies.push({ author, comment, createdAt: new Date() });
    await review.save();
    res.status(201).json({ success: true, message: "Reply added successfully!", data: review });
});
//# sourceMappingURL=review.controller.js.map