"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRole = exports.isAuthenticated = void 0;
const AppError_1 = require("../utils/AppError");
const redis_1 = require("../utils/redis");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token)
        return next(new AppError_1.AppError(401, "Access token missing"));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_secret);
        const userData = await redis_1.redis.get(decoded.id);
        if (!userData)
            return next(new AppError_1.AppError(404, "User not found"));
        const user = JSON.parse(userData);
        if (!user)
            return next(new AppError_1.AppError(404, "User not found"));
        req.user = user;
        next();
    }
    catch {
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