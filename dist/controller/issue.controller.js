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
    if (!title || !category || !description || !location || !division || !date) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }
    let issueImages = images;
    if (image && !images) {
        issueImages = [image];
    }
    if (!issueImages || !Array.isArray(issueImages)) {
        return res.status(400).json({
            success: false,
            message: "Images field is required and must be an array"
        });
    }
    const newIssue = await issue_model_1.Issue.create({
        title,
        category,
        description,
        images: issueImages || [],
        location,
        division,
        author: req.user?._id,
        date,
    });
    res.status(201).json({
        success: true,
        message: "Issue created successfully!",
        issue: newIssue,
    });
});
// Added new controller for Admin approval
exports.approveIssue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const issue = await issue_model_1.Issue.findById(issueId);
    if (!issue) {
        return res.status(404).json({ success: false, message: "Issue not found" });
    }
    if (issue.status !== issue_model_1.IssueStatus.PENDING) {
        return res.status(400).json({
            success: false,
            message: "Issue already approved or processed"
        });
    }
    issue.status = issue_model_1.IssueStatus.SOLVED;
    issue.approvedBy = new mongoose_1.default.Types.ObjectId(req.user?._id);
    issue.approvedAt = new Date();
    await issue.save();
    await issue.populate('approvedBy', 'name email');
    res.status(200).json({
        success: true,
        message: "Issue approved successfully!",
        issue,
    });
});
// all issues
exports.getAllIssues = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 10, sort = "-createdAt", status, division, category, search } = req.query;
    // Build query object
    const query = {};
    if (status)
        query.status = status;
    if (division)
        query.division = division;
    if (category)
        query.category = category;
    if (search) {
        query.$text = { $search: search };
    }
    // Pagination
    const pageNumber = Math.max(1, parseInt(page, 10));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit, 10))); // Limit max 50 per page
    try {
        // Fetch issues with filter/sort/pagination
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
        // Total count for pagination
        const total = await issue_model_1.Issue.countDocuments(query);
        res.status(200).json({
            success: true,
            message: "All issues fetched successfully",
            total,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                pages: Math.ceil(total / limitNumber),
            },
            issues,
        });
    }
    catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching issues",
        });
    }
});
// single issue
exports.getIssueById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    if (!issueId) {
        return res.status(400).json({ success: false, message: "Issue ID is required" });
    }
    const issue = await issue_model_1.Issue.findById(issueId)
        .populate({
        path: "reviews",
        populate: {
            path: "author replies.author",
            select: "name email",
        },
    })
        .populate("author", "name email")
        .populate("approvedBy", "name email");
    if (!issue) {
        return res.status(404).json({ success: false, message: "Issue not found" });
    }
    res.status(200).json({
        success: true,
        message: "Issue fetched successfully",
        issue,
    });
});
// edit issue
exports.editIssue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const { title, category, description, image, images, location, division, date } = req.body;
    if (!title || !category || !description || !location || !division || !date) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }
    let issueImages = images;
    if (image && !images) {
        issueImages = [image];
    }
    if (!issueImages || !Array.isArray(issueImages)) {
        return res.status(400).json({
            success: false,
            message: "Images field is required and must be an array"
        });
    }
    const updatedIssue = await issue_model_1.Issue.findByIdAndUpdate(issueId, {
        title,
        category,
        description,
        images: issueImages,
        location,
        division,
        date,
    }, { new: true, runValidators: true }).populate("author", "name email")
        .populate("approvedBy", "name email");
    if (!updatedIssue) {
        return res.status(404).json({
            success: false,
            message: "Issue not found"
        });
    }
    res.status(200).json({
        success: true,
        message: "Issue updated successfully",
        issue: updatedIssue,
    });
});
//# sourceMappingURL=issue.controller.js.map