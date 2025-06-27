"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class TransactionValidator {
    /**
     * Validation rules for getting user transactions
     */
    static getUserTransactions() {
        return [
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('Search must be a string')
                .trim(),
        ];
    }
    /**
     * Validation rules for getting all transactions (admin)
     */
    static getAllTransactions() {
        return [
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100'),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('Search must be a string')
                .trim(),
        ];
    }
}
exports.default = TransactionValidator;
