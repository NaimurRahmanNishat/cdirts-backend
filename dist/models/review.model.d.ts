import mongoose, { Document } from "mongoose";
export interface IReply {
    author: mongoose.Types.ObjectId;
    comment: string;
    createdAt: Date;
}
export interface IReview extends Document {
    author: mongoose.Types.ObjectId;
    comment: string;
    createdAt: Date;
    replies: IReply[];
}
export declare const Review: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=review.model.d.ts.map