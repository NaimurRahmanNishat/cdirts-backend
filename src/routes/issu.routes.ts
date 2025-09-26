import { Router } from "express";
import { createIssue, editIssue, getAllIssues, getIssueById } from "../controller/issu.controller";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// create issue
router.post("/create-issue", isAuthenticated, createIssue);
router.get("/all-issues", getAllIssues);
router.get("/:issueId", getIssueById);
router.patch("/edit-issue/:issueId", isAuthenticated, editIssue);

export default router;