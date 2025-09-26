"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editIssue = exports.getIssueById = exports.getAllIssues = exports.createIssue = void 0;
const catchAsync_1 = require("../middleware/catchAsync");
const issu_model_1 = require("../models/issu.model");
exports.createIssue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, category, description, image, images, location, division, author } = req.body;
    if (!title || !category || !description || !location || !division || !author) {
        throw new Error("All fields are required");
    }
    let issueImages = images;
    if (image && !images) {
        issueImages = [image];
    }
    if (!issueImages || !Array.isArray(issueImages)) {
        throw new Error("Images field is required and must be an array");
    }
    const newIssue = await issu_model_1.Issue.create({
        title,
        category,
        description,
        images: issueImages,
        location,
        division,
        author,
    });
    res.status(201).json({
        success: true,
        message: "Issue created successfully!",
        issue: newIssue,
    });
});
// all issues
exports.getAllIssues = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page = 1, limit = 10, sort = "-createdAt", status, division, category, search } = req.query;
    // 🔎 Build query object
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
    // 📊 Pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    // 🛠️ Fetch issues with filter/sort/pagination
    const issues = await issu_model_1.Issue.find(query)
        .populate({
        path: "reviews",
        populate: {
            path: "author replies.author",
            select: "name email",
        },
    })
        .populate("author", "name email")
        .sort(sort)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean();
    // 📌 Total count for pagination
    const total = await issu_model_1.Issue.countDocuments(query);
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
});
// single issue
exports.getIssueById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { issueId } = req.params;
    const issue = await issu_model_1.Issue.findById(issueId).populate({
        path: "reviews",
        populate: {
            path: "author replies.author",
            select: "name email",
        },
    });
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
    const { title, category, description, image, images, location, division } = req.body;
    if (!title || !category || !description || !location || !division) {
        throw new Error("All fields are required");
    }
    let issueImages = images;
    if (image && !images) {
        issueImages = [image];
    }
    if (!issueImages || !Array.isArray(issueImages)) {
        throw new Error("Images field is required and must be an array");
    }
    const updatedIssue = await issu_model_1.Issue.findByIdAndUpdate(issueId, {
        title,
        category,
        description,
        images: issueImages,
        location,
        division,
    }, { new: true });
    res.status(200).json({
        success: true,
        message: "Issue updated successfully",
        issue: updatedIssue,
    });
});
//# sourceMappingURL=issu.controller.js.map