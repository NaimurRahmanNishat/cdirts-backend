"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const generateAccessToken = (payload) => {
    const secret = config_1.default.jwt_access_secret;
    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is not defined");
    }
    const expiresIn = config_1.default.access_token_expires_in || "15m";
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const secret = config_1.default.refresh_token_secret;
    if (!secret) {
        throw new Error("JWT_REFRESH_SECRET is not defined");
    }
    const expiresIn = config_1.default.refresh_token_expires_in || "7d";
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_secret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.default.refresh_token_secret);
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=token.js.map