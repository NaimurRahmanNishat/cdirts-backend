import { Request, Response, NextFunction } from "express";

export const verifyAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.role !== "admin") {
    res.status(403).send({ message: "Access denied! Only admin can access!" });
    return;
  }
  next();
};