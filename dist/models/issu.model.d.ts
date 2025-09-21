import mongoose, { Document } from "mongoose";
export interface IIssue extends Document {
    title: string;
    description: string;
    image?: {
        public_id: string;
        url: string;
    };
    location?: string;
    status: "pending" | "in-progress" | "resolved";
    createdBy: mongoose.Types.ObjectId;
    phone: string;
    otpCode?: string;
    otpExpire?: Date;
    verified: boolean;
}
export declare const Issue: mongoose.Model<IIssue, {}, {}, {}, mongoose.Document<unknown, {}, IIssue, {}, {}> & IIssue & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=issu.model.d.ts.map