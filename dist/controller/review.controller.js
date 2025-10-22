"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReplyToReview = exports.createReview = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const review_model_1 = require("../models/review.model");
const issue_model_1 = require("../models/issue.model");
// Review create
exports.createReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const { author, comment } = req.body;
    if (!issueId || !author || !comment) {
        throw new Error("Issue ID, author, and comment are required");
    }
    // Review তৈরি
    const newReview = await review_model_1.Review.create({
        issue: issueId,
        author,
        comment,
    });
    // Issue এর সাথে Review লিংক
    await issue_model_1.Issue.findByIdAndUpdate(issueId, { $push: { reviews: newReview._id } });
    res.status(201).json({
        success: true,
        message: "Review added successfully!",
        review: newReview,
    });
});
// Reply create
exports.addReplyToReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { reviewId } = req.params;
    const { author, comment } = req.body;
    if (!reviewId || !author || !comment) {
        throw new Error("Review ID, author, and comment are required");
    }
    const review = await review_model_1.Review.findById(reviewId);
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
//# sourceMappingURL=review.controller.js.map