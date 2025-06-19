"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class BlockValidator {
    static getBlockedActions() {
        return [
            (0, express_validator_1.param)('phoneNo')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .isMobilePhone('any')
                .withMessage('Invalid phone number format'),
        ];
    }
    static updateBlockActions() {
        return [
            (0, express_validator_1.param)('phoneNo')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .isMobilePhone('any')
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.body)('actions')
                .isArray({ min: 1 })
                .withMessage('At least one action is required'),
            (0, express_validator_1.body)('actions.*.actionType')
                .notEmpty()
                .withMessage('Action type is required'),
            (0, express_validator_1.body)('actions.*.active')
                .isBoolean()
                .withMessage('Active status must be boolean'),
            (0, express_validator_1.body)('actions.*.reason')
                .optional()
                .isString()
                .withMessage('Reason must be a string'),
            (0, express_validator_1.body)('actions.*.expiresAt')
                .optional()
                .isISO8601()
                .withMessage('Invalid date format'),
        ];
    }
    static checkBlockStatus() {
        return [
            (0, express_validator_1.param)('phoneNo')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .isMobilePhone('any')
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.query)('actionType').notEmpty().withMessage('Action type is required'),
        ];
    }
    static getAllBlockedUsers() {
        return [
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1-100'),
        ];
    }
    static getBlockHistory() {
        return [
            (0, express_validator_1.param)('phoneNo')
                .trim()
                .notEmpty()
                .withMessage('Phone number is required')
                .isMobilePhone('any')
                .withMessage('Invalid phone number format'),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1-100'),
        ];
    }
}
exports.default = BlockValidator;
