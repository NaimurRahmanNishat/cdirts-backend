"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAccessTokenCookie = exports.setAuthCookies = void 0;
const config_1 = __importDefault(require("../config"));
const setAuthCookies = (res, accessToken, refreshToken) => {
    // Set access token cookie (15 minutes)
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: config_1.default.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    // Set refresh token cookie (7 days)
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: config_1.default.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
exports.setAuthCookies = setAuthCookies;
const setAccessTokenCookie = (res, accessToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: config_1.default.nodeEnv === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
};
exports.setAccessTokenCookie = setAccessTokenCookie;
//# sourceMappingURL=cookie.js.map