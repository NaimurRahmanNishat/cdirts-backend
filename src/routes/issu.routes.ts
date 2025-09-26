import { Router } from "express";
import { createIssue, editIssue, getAllIssues, getIssueById } from "../controller/issu.controller";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// create issue
router.post("/create-issue", createIssue);
router.get("/all-issues", getAllIssues);
router.get("/:issueId", getIssueById);
router.patch("/edit-issue/:issueId", editIssue);

export default router;