import { Router } from "express";
import { addReplyToReview, createReview } from "../controller/review.controller";


const router = Router();

// create review
router.post("/create-review/:issueId", createReview);
router.post("/add-reply/:reviewId", addReplyToReview);

export default router;