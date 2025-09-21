import { NextFunction, Request, Response } from "express";
import { IUser } from "../models/user.model";
export interface AuthRequest extends Request {
    user?: IUser;
}
export declare const isAuthenticated: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorizeRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map