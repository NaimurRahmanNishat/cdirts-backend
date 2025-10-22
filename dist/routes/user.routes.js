"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controller/user.controller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 🧩 User Authentication Routes
router.post("/register", user_controller_1.registerUser);
router.post("/activate-user", user_controller_1.activateUser);
router.post("/login", user_controller_1.loginUser);
router.post("/social-auth", user_controller_1.socialAuth);
router.post("/refresh-token", user_controller_1.refreshAccessToken);
// 🔐 Password Management
router.post("/forgot-password", user_controller_1.forgetPassword);
router.post("/reset-password", user_controller_1.resetPassword);
// 🚪 Logout & Profile
router.post("/logout", user_controller_1.logoutUser);
router.patch("/update-profile", auth_1.isAuthenticated, user_controller_1.updateProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map