"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controller/review.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// create review
router.post("/create-review/:issueId", auth_1.isAuthenticated, review_controller_1.createReview);
router.post("/add-reply/:reviewId", auth_1.isAuthenticated, review_controller_1.addReplyToReview);
exports.default = router;
//# sourceMappingURL=review.routes.js.map