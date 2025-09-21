import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { redis } from "../utils/redis";
import jwt from "jsonwebtoken";
import config from "../config";

export interface AuthRequest extends Request {
  user?: IUser;
}

// Authentication middleware
export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return next(new AppError(401, "Access token missing"));

  try {
    const decoded = jwt.verify(token, config.jwt_access_secret!) as { id: string };
    const userData = await redis.get(decoded.id);
    if (!userData) return next(new AppError(404, "User not found"));
    
    const user = JSON.parse(userData) as IUser;
    if (!user) return next(new AppError(404, "User not found"));

    req.user = user;
    next();
  } catch {
    return next(new AppError(401, "Token expired or invalid"));
  }
};

// Authorization middleware
export const authorizeRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "Not authorized"));
    }
    next();
  };
};
