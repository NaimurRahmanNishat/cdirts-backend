import { catchAsync } from "../middleware/catchAsync";
import { Issue } from "../models/issue.model";
import { Request, Response } from "express";

// create issue
export const createIssue = catchAsync(async (req: Request, res: Response) => {
  const { title, category, description, image, images, location, division, author, date } = req.body;

  if (!title || !category || !description || !location || !division || !author || !date) {
    throw new Error("All fields are required");
  }

  let issueImages = images;
  if (image && !images) {
    issueImages = [image];
  }

  if (!issueImages || !Array.isArray(issueImages)) {
    throw new Error("Images field is required and must be an array");
  }

  const newIssue = await Issue.create({
    title,
    category,
    description,
    images: issueImages || [],
    location,
    division,
    author,
    date,
  });

  res.status(201).json({
    success: true,
    message: "Issue created successfully!",
    issue: newIssue,
  });
});

// all issues
export const getAllIssues = catchAsync(async (req: Request, res: Response) => {
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
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);

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
});

// single issue
export const getIssueById = catchAsync(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const issue = await Issue.findById(issueId).populate({
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
export const editIssue = catchAsync(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const { title, category, description, image, images, location, division, date } = req.body;

  if (!title || !category || !description || !location || !division || !date) {
    throw new Error("All fields are required");
  }

  let issueImages = images;
  if (image && !images) {
    issueImages = [image];
  }

  if (!issueImages || !Array.isArray(issueImages)) {
    throw new Error("Images field is required and must be an array"); 
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
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Issue updated successfully",
    issue: updatedIssue,
  });
});
