"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Issue = exports.IssueCategory = exports.IssueStatus = exports.BangladeshDivision = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var BangladeshDivision;
(function (BangladeshDivision) {
    BangladeshDivision["DHAKA"] = "Dhaka";
    BangladeshDivision["CHATTOGRAM"] = "Chattogram";
    BangladeshDivision["RAJSHAHI"] = "Rajshahi";
    BangladeshDivision["KHULNA"] = "Khulna";
    BangladeshDivision["BARISHAL"] = "Barishal";
    BangladeshDivision["SYLHET"] = "Sylhet";
    BangladeshDivision["RANGPUR"] = "Rangpur";
    BangladeshDivision["MYMENSINGH"] = "Mymensingh";
})(BangladeshDivision || (exports.BangladeshDivision = BangladeshDivision = {}));
var IssueStatus;
(function (IssueStatus) {
    IssueStatus["PENDING"] = "pending";
    IssueStatus["IN_PROGRESS"] = "in-progress";
    IssueStatus["RESOLVED"] = "resolved";
})(IssueStatus || (exports.IssueStatus = IssueStatus = {}));
var IssueCategory;
(function (IssueCategory) {
    IssueCategory["ELECTRICITY"] = "electricity";
    IssueCategory["WATER"] = "water";
    IssueCategory["GAS"] = "gas";
    IssueCategory["OTHER"] = "other";
})(IssueCategory || (exports.IssueCategory = IssueCategory = {}));
const issueSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    category: {
        type: String,
        enum: Object.values(IssueCategory),
        required: true,
        trim: true,
    },
    description: { type: String, required: true, trim: true },
    images: [
        {
            public_id: { type: String, required: true },
            url: { type: String, required: true },
        },
    ],
    location: { type: String, required: true, trim: true },
    division: {
        type: String,
        enum: Object.values(BangladeshDivision),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(IssueStatus),
        default: IssueStatus.PENDING,
    },
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    reviews: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Review" }],
}, { timestamps: true });
// search index
issueSchema.index({ title: "text", description: "text", location: "text" });
exports.Issue = mongoose_1.default.model("Issue", issueSchema);
//# sourceMappingURL=issu.model.js.map