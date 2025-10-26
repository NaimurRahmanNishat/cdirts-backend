"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const issue_controller_1 = require("../controller/issue.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// create issue 
router.post("/create-issue", auth_1.isAuthenticated, issue_controller_1.createIssue);
router.put("/approve/:issueId", auth_1.isAuthenticated, (0, auth_1.authorizeRole)("admin"), issue_controller_1.approveIssue);
router.get("/all-issues", issue_controller_1.getAllIssues);
router.get("/single-issue/:issueId", issue_controller_1.getIssueById);
router.patch("/edit-issue/:issueId", auth_1.isAuthenticated, issue_controller_1.editIssue);
exports.default = router;
//# sourceMappingURL=issue.routes.js.map