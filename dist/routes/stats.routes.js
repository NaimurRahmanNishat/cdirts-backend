"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controller/stats.controller");
const router = (0, express_1.Router)();
// user stats
router.get("/user-stats/:email", stats_controller_1.userStats);
// admin stats
router.get("/admin-stats", stats_controller_1.adminStats);
exports.default = router;
//# sourceMappingURL=stats.routes.js.map