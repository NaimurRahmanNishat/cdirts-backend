import mongoose from "mongoose";
export interface IUser extends mongoose.Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    otp?: string;
    otpExpire?: Date;
    role: "user" | "admin";
    avatar?: {
        public_id: string;
        url: string;
    };
    passwordResetToken?: string;
    passwordResetExpire?: Date;
    phone?: string;
    nid?: string;
    comparePassword(password: string): Promise<boolean>;
}
export declare const emailRegex: RegExp;
export declare const phoneRegex: RegExp;
export declare const nidRegex: RegExp;
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=user.model.d.ts.map