import mongoose, { Document } from "mongoose";
export declare enum BangladeshDivision {
    DHAKA = "Dhaka",
    CHATTOGRAM = "Chattogram",
    RAJSHAHI = "Rajshahi",
    KHULNA = "Khulna",
    BARISHAL = "Barishal",
    SYLHET = "Sylhet",
    RANGPUR = "Rangpur",
    MYMENSINGH = "Mymensingh"
}
export declare enum IssueStatus {
    PENDING = "pending",
    IN_PROGRESS = "in-progress",
    SOLVED = "solved"
}
export declare enum IssueCategory {
    ELECTRICITY = "electricity",
    WATER = "water",
    GAS = "gas",
    BROKEN_ROAD = "broken-road",
    OTHER = "other"
}
export interface IIssue extends Document {
    title: string;
    category: IssueCategory;
    description: string;
    images: {
        public_id: string;
        url: string;
    }[];
    location: string;
    division: BangladeshDivision;
    status: IssueStatus;
    author: mongoose.Types.ObjectId;
    reviews: mongoose.Types.ObjectId[];
    date: Date;
    approvedBy?: mongoose.Types.ObjectId | null;
    approvedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const Issue: mongoose.Model<IIssue, {}, {}, {}, mongoose.Document<unknown, {}, IIssue, {}, {}> & IIssue & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=issue.model.d.ts.map