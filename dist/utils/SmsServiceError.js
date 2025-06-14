"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsServiceError = void 0;
class SmsServiceError extends Error {
    constructor(status, message) {
        super(message);
        this.statusCode = status;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.SmsServiceError = SmsServiceError;
exports.default = SmsServiceError;
