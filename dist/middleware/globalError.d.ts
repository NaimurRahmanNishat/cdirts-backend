import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
declare const globalErrorHandler: (err: AppError, req: Request, res: Response, next: NextFunction) => void;
export default globalErrorHandler;
//# sourceMappingURL=globalError.d.ts.map