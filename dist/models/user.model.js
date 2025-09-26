"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [20, "Name cannot exceed 20 characters"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
        validate: {
            validator: function (v) {
                return emailRegex.test(v);
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    password: { type: String, required: true, minlength: 6, trim: true },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpire: { type: Date, index: { expires: 300 } }, // 5 minutes
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    avatar: {
        public_id: String,
        url: String,
    },
    passwordResetToken: String,
    passwordResetExpire: Date,
    refreshToken: String,
    phone: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || phoneRegex.test(v);
            },
            message: "Please provide a valid Bangladesh phone number"
        }
    },
    nid: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return !v || nidRegex.test(v);
            },
            message: "Please provide a valid Bangladesh NID number"
        }
    },
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    if (this.password.startsWith("$2b$"))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 10);
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt_1.default.compare(password, this.password);
};
exports.User = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=user.model.js.map