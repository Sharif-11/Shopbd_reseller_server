"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const SmsServiceError_1 = __importDefault(require("../utils/SmsServiceError"));
const prismaErrorHandler_1 = require("./prismaErrorHandler");
const globalErrorHandler = (error, req, res, next) => {
    let errorResponse = {
        statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
        success: false,
        message: 'Something went wrong!',
    };
    // Handle known error types
    if (error instanceof ApiError_1.default || error instanceof SmsServiceError_1.default) {
        errorResponse = {
            statusCode: error.statusCode,
            success: false,
            message: error.message,
        };
    }
    else if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        errorResponse = {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Database error occurred',
        };
    }
    else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        errorResponse = {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: 'Validation error occurred',
        };
    }
    else if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        errorResponse = {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Database connection error',
        };
    }
    else if (error instanceof Error) {
        errorResponse = {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: error.message,
        };
    }
    // Add stack trace and additional details in development
    if (config_1.default.env === 'development') {
        errorResponse.stack = error.stack;
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            errorResponse.errors = [error.meta];
            errorResponse.message = (0, prismaErrorHandler_1.knownRequestHandler)(error);
        }
    }
    // Log the error for server-side inspection
    console.log('Error occurred:', error);
    // Send response
    res.status(errorResponse.statusCode).json(errorResponse);
};
exports.default = globalErrorHandler;
