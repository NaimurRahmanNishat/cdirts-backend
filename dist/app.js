"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const config_1 = __importDefault(require("./config"));
const globalError_1 = __importDefault(require("./middleware/globalError"));
// Middleware
app.use((0, cors_1.default)({
    origin: [config_1.default.client_url, "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));
// Increase body parser limits for image uploads
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "50mb", extended: true }));
// Routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const issue_routes_1 = __importDefault(require("./routes/issue.routes"));
const UploadImage_1 = require("./utils/UploadImage");
app.use("/api/auth", user_routes_1.default);
app.use("/api/issue", issue_routes_1.default);
app.use("/api/review", review_routes_1.default);
app.use("/api/stats", stats_routes_1.default);
app.post("/uploadImage", async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({
                success: false,
                message: "Image data is required"
            });
        }
        // Check if base64 string is too large (rough estimate)
        if (image.length > 15 * 1024 * 1024) { // 15MB limit for base64
            return res.status(413).json({
                success: false,
                message: "Image size too large. Maximum size is 10MB"
            });
        }
        // Upload to Cloudinary
        const url = await (0, UploadImage_1.UploadImage)(image);
        res.status(200).json({
            success: true,
            url: url,
            message: "Image uploaded successfully"
        });
    }
    catch (error) {
        console.error("Image upload error:", error);
        // Specific error handling
        if (error.message.includes("File size too large")) {
            return res.status(413).json({
                success: false,
                message: "Image size too large. Maximum size is 10MB"
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Image upload failed"
        });
    }
});
app.get("/", (_req, res) => {
    res.send("Citizen Driven Issue Reporting & Tracking System Server is Running...");
});
// global error handler
app.use(globalError_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map