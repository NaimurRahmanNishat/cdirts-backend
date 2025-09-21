"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
    });
};
exports.default = globalErrorHandler;
//# sourceMappingURL=globalError.js.map