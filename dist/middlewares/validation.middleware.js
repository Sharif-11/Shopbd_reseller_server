"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    console.log(errors.array());
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0]; // Get the first error from the array
        return res.status(400).json({
            statusCode: 400,
            message: firstError.msg, // Use the first error's message
            success: false,
        });
    }
    next();
};
exports.default = validateRequest;
