"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.isAuthenticated = void 0;
const user_model_1 = require("../models/user.model");
const AppError_1 = require("../utils/AppError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const authState_1 = require("./authState");
// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token)
        return next(new AppError_1.AppError(401, "Access token missing"));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_secret);
        let userData = await (0, authState_1.getUserState)(decoded.id);
        if (!userData) {
            const dbUser = await user_model_1.User.findById(decoded.id).lean();
            if (!dbUser)
                return next(new AppError_1.AppError(404, "User not found"));
            const plain = { ...dbUser };
            if (plain.password)
                delete plain.password;
            await (0, authState_1.setUserState)(decoded.id, plain);
            userData = plain;
        }
        req.user = userData;
        next();
    }
    catch (err) {
        console.error("isAuthenticated error:", err);
        return next(new AppError_1.AppError(401, "Token expired or invalid"));
    }
};
exports.isAuthenticated = isAuthenticated;
// Authorization middleware
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError_1.AppError(403, "Not authorized"));
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
//# sourceMappingURL=auth.js.map