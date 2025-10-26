import { Router } from "express";
import { addReplyToReview, createReview } from "../controller/review.controller";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// Create Review
router.post("/create-review/:issueId", isAuthenticated, createReview);

// Add Reply
router.post("/add-reply/:reviewId", isAuthenticated, addReplyToReview);

export default router;
