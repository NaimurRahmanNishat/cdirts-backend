import { Router } from "express";
import { approveIssue, createIssue, editIssue, getAllIssues, getIssueById } from "../controller/issue.controller";
import { authorizeRole, isAuthenticated } from "../middleware/auth";

const router = Router();

// create issue 
router.post("/create-issue", isAuthenticated,  createIssue);
router.put("/approve/:issueId", isAuthenticated, authorizeRole("admin"), approveIssue);
router.get("/all-issues", getAllIssues);
router.get("/single-issue/:issueId", getIssueById);
router.patch("/edit-issue/:issueId", isAuthenticated, editIssue);

export default router;