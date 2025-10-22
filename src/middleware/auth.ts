import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { redis } from "../utils/redis";
import jwt from "jsonwebtoken";
import config from "../config";
import { getUserState, setUserState } from "./authState";

export interface AuthRequest extends Request {
  user?: IUser | undefined;
}

// Authentication middleware
export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) return next(new AppError(401, "Access token missing"));

  try {
    const decoded = jwt.verify(token, config.jwt_access_secret!) as { id: string };
    let userData = await getUserState(decoded.id);
    if (!userData) {
      const dbUser = await User.findById(decoded.id).lean();
      if (!dbUser) return next(new AppError(404, "User not found"));
      const plain = { ...dbUser } as any;
      if (plain.password) delete plain.password;
      await setUserState(decoded.id, plain);
      userData = plain as any;
    }
    req.user = userData as any;
    next();
  } catch(err) {
    console.error("isAuthenticated error:", err);
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
