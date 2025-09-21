import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import config from "../config";

export const generateAccessToken = (payload: object): string => {
  const secret = config.jwt_access_secret;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }
  
  const expiresIn = config.access_token_expires_in || "15m";
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const generateRefreshToken = (payload: object): string => {
  const secret = config.refresh_token_secret;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  
  const expiresIn = config.refresh_token_expires_in || "7d";
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, config.jwt_access_secret!);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.refresh_token_secret!);
};