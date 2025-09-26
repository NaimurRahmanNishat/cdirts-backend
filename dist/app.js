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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: [config_1.default.client_url],
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json({ limit: "50mb" }));
app.use(body_parser_1.default.urlencoded({ limit: "50mb", extended: true }));
// global error handler
app.use(globalError_1.default);
// Routes
const user_routes_1 = __importDefault(require("./routes/user.routes"));
app.use("/api/auth", user_routes_1.default);
const issu_routes_1 = __importDefault(require("./routes/issu.routes"));
app.use("/api/issue", issu_routes_1.default);
const review_routes_1 = __importDefault(require("./routes/review.routes"));
app.use("/api/review", review_routes_1.default);
app.get("/", (_req, res) => {
    res.send("Citizen Driven Issue Reporting & Tracking System Server is Running...");
});
exports.default = app;
//# sourceMappingURL=app.js.map