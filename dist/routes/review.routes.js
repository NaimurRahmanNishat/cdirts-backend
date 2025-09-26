"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controller/review.controller");
const router = (0, express_1.Router)();
// create review
router.post("/create-review/:issueId", review_controller_1.createReview);
router.post("/add-reply/:reviewId", review_controller_1.addReplyToReview);
exports.default = router;
//# sourceMappingURL=review.routes.js.map