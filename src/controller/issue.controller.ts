import mongoose from "mongoose";
import { catchAsync } from "../middleware/catchAsync";
import { Issue, IssueStatus } from "../models/issue.model";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";

// create issue
export const createIssue = catchAsync(async (req: AuthRequest, res: Response) => {
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

  const newIssue = await Issue.create({
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
export const approveIssue = catchAsync(async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;

  const issue = await Issue.findById(issueId);
  if (!issue) {
    return res.status(404).json({ success: false, message: "Issue not found" });
  }

  if (issue.status !== IssueStatus.PENDING) {
    return res.status(400).json({ 
      success: false, 
      message: "Issue already approved or processed" 
    });
  }

  issue.status = IssueStatus.SOLVED;
  issue.approvedBy = new mongoose.Types.ObjectId(req.user?._id as string);
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
export const getAllIssues = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, sort = "-createdAt", status, division, category, search } = req.query;

  // Build query object
  const query: any = {};

  if (status) query.status = status; 
  if (division) query.division = division;
  if (category) query.category = category; 

  if (search) {
    query.$text = { $search: search as string }; 
  }

  // Pagination
  const pageNumber = Math.max(1, parseInt(page as string, 10));
  const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string, 10))); // Limit max 50 per page

  try {
    // Fetch issues with filter/sort/pagination
    const issues = await Issue.find(query)
      .populate({
        path: "reviews",
        populate: {
          path: "author replies.author",
          select: "name email",
        },
      })
      .populate("author", "name email")
      .populate("approvedBy", "name email") 
      .sort(sort as string)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    // Total count for pagination
    const total = await Issue.countDocuments(query);

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
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issues",
    });
  }
});

// single issue
export const getIssueById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;
  
  if (!issueId) {
    return res.status(400).json({ success: false, message: "Issue ID is required" });
  }

  const issue = await Issue.findById(issueId)
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
export const editIssue = catchAsync(async (req: AuthRequest, res: Response) => {
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

  const updatedIssue = await Issue.findByIdAndUpdate(
    issueId,
    {
      title,
      category,
      description,
      images: issueImages,
      location,
      division,
      date,
    },
    { new: true, runValidators: true }
  ).populate("author", "name email")
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
