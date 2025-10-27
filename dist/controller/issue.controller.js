"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editIssue = exports.getIssueById = exports.getAllIssues = exports.approveIssue = exports.createIssue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsync_1 = require("../middleware/catchAsync");
const issue_model_1 = require("../models/issue.model");
// create issue
exports.createIssue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, category, description, image, images, location, division, date } = req.body;
    if (!title || !category || !description || !location || !division) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    let issueImages = images;
    if (image && !images) {
        issueImages = [image];
    }
    if (!issueImages || !Array.isArray(issueImages)) {
        // allow empty array as well but ensure it's an array
        issueImages = [];
    }
    const newIssue = await issue_model_1.Issue.create({
        title,
        category,
        description,
        images: issueImages,
        location,
        division,
        author: req.user._id,
        date: date || Date.now(),
    });
    res.status(201).json({ success: true, message: "Issue created successfully!", issue: newIssue });
});
// Approve issue (admin)
exports.approveIssue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const issue = await issue_model_1.Issue.findById(issueId);
    if (!issue)
        return res.status(404).json({ success: false, message: "Issue not found" });
    if (issue.status !== issue_model_1.IssueStatus.PENDING) {
        return res.status(400).json({ success: false, message: "Issue already approved or processed" });
    }
    // If the admin approves, set status to IN_PROGRESS or SOLVED depending on your flow.
    // Keeping SOLVED as you had, but often approval means in-progress. Adjust if needed.
    issue.status = issue_model_1.IssueStatus.SOLVED;
    issue.approvedBy = new mongoose_1.default.Types.ObjectId(req.user._id);
    issue.approvedAt = new Date();
    await issue.save();
    await issue.populate("approvedBy", "name email");
    res.status(200).json({ success: true, message: "Issue approved successfully!", issue });
});
// getAllIssues and getIssueById remain the same but ensure population paths exist
exports.getAllIssues = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 10, sort = "-createdAt", status, division, category, search } = req.query;
    const query = {};
    if (status)
        query.status = status;
    if (division)
        query.division = division;
    if (category)
        query.category = category;
    if (search)
        query.$text = { $search: search };
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const issues = await issue_model_1.Issue.find(query)
        .populate({
        path: "reviews",
        populate: {
            path: "author replies.author",
            select: "name email",
        },
    })
        .populate("author", "name email")
        .populate("approvedBy", "name email")
        .sort(sort)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();
    const total = await issue_model_1.Issue.countDocuments(query);
    res.status(200).json({
        success: true,
        message: "All issues fetched successfully",
        total,
        pagination: { page: pageNumber, limit: limitNumber, pages: Math.ceil(total / limitNumber) },
        issues,
    });
});
// single issue
exports.getIssueById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    if (!issueId)
        return res.status(400).json({ success: false, message: "Issue ID is required" });
    const issue = await issue_model_1.Issue.findById(issueId)
        .populate({
        path: "reviews",
        populate: { path: "author replies.author", select: "name email" },
    })
        .populate("author", "name email")
        .populate("approvedBy", "name email");
    if (!issue)
        return res.status(404).json({ success: false, message: "Issue not found" });
    res.status(200).json({ success: true, message: "Issue fetched successfully", issue });
});
// edit issue
exports.editIssue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const { title, category, description, image, images, location, division, date } = req.body;
    if (!title || !category || !description || !location || !division) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    let issueImages = images;
    if (image && !images)
        issueImages = [image];
    if (!issueImages || !Array.isArray(issueImages))
        issueImages = [];
    const updatedIssue = await issue_model_1.Issue.findByIdAndUpdate(issueId, { title, category, description, images: issueImages, location, division, date }, { new: true, runValidators: true })
        .populate("author", "name email")
        .populate("approvedBy", "name email");
    if (!updatedIssue)
        return res.status(404).json({ success: false, message: "Issue not found" });
    res.status(200).json({ success: true, message: "Issue updated successfully", issue: updatedIssue });
});
//# sourceMappingURL=issue.controller.js.map