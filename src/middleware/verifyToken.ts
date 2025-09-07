import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/ResponseHandler";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    role?: string;
  }
}

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return errorResponse(res, 401, "Unauthenticated access!");
    }

    const decoded = jwt.verify(token, JWT_SECRET_KEY) as {
      userId: string;
      role: string;
    };

    if (!decoded?.userId) {
      return errorResponse(res, 403, "Access denied!");
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return errorResponse(res, 500, "Invalid token!");
  }
};

export default verifyToken;