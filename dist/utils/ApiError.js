"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.statusCode = status;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = ApiError;
