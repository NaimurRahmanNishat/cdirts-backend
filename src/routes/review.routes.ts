import { Router } from "express";
import { addReplyToReview, createReview } from "../controller/review.controller";
import { isAuthenticated } from "../middleware/auth";
import { Review } from "../models/review.model";

const router = Router();

// Create Review
router.post("/create-review/:issueId", isAuthenticated, createReview);

// Add Reply
router.post("/add-reply/:reviewId", isAuthenticated, addReplyToReview);

// Get all reviews of an issue
router.get("/issue/:issueId", async (req, res) => {
  const reviews = await Review.find({ issue: req.params.issueId })
    .populate("author", "name")
    .populate("replies.author", "name")
    .sort({ createdAt: -1 });
  res.json(reviews);
});

export default router;
