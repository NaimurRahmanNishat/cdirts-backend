"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const issu_controller_1 = require("../controller/issu.controller");
const router = (0, express_1.Router)();
// create issue
router.post("/create-issue", issu_controller_1.createIssue);
router.get("/all-issues", issu_controller_1.getAllIssues);
router.get("/:issueId", issu_controller_1.getIssueById);
router.patch("/edit-issue/:issueId", issu_controller_1.editIssue);
exports.default = router;
//# sourceMappingURL=issu.routes.js.map