"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class ConfigValidator {
    /**
     * Validation rules for creating/updating config
     */
    static upsertConfig() {
        return [
            (0, express_validator_1.body)('type')
                .notEmpty()
                .withMessage('Config type is required')
                .isString()
                .withMessage('Config type must be a string')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Config type must be between 2 and 50 characters')
                .matches(/^[a-zA-Z0-9_-]+$/)
                .withMessage('Config type can only contain letters, numbers, underscores and hyphens'),
            (0, express_validator_1.body)('content')
                .notEmpty()
                .withMessage('Config content is required')
                .isObject()
                .withMessage('Config content must be an object')
                .custom(value => {
                if (Object.keys(value).length === 0) {
                    throw new Error('Config content cannot be empty');
                }
                return true;
            }),
        ];
    }
    /**
     * Validation rules for config type parameter
     */
    static configTypeParam() {
        return [
            (0, express_validator_1.param)('type')
                .notEmpty()
                .withMessage('Config type is required')
                .isString()
                .withMessage('Config type must be a string')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Config type must be between 2 and 50 characters')
                .matches(/^[a-zA-Z0-9_-]+$/)
                .withMessage('Config type can only contain letters, numbers, underscores and hyphens'),
        ];
    }
    /**
     * Validation rules for feature check
     */
    static featureCheck() {
        return [
            (0, express_validator_1.param)('type')
                .notEmpty()
                .withMessage('Config type is required')
                .isString()
                .withMessage('Config type must be a string')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Config type must be between 2 and 50 characters')
                .matches(/^[a-zA-Z0-9_-]+$/)
                .withMessage('Config type can only contain letters, numbers, underscores and hyphens'),
            (0, express_validator_1.param)('feature')
                .notEmpty()
                .withMessage('Feature name is required')
                .isString()
                .withMessage('Feature name must be a string')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Feature name must be between 2 and 50 characters')
                .matches(/^[a-zA-Z0-9_-]+$/)
                .withMessage('Feature name can only contain letters, numbers, underscores and hyphens'),
        ];
    }
    /**
     * Validation rules for getting all configs
     */
    static getAllConfigs() {
        return [
        // Can add pagination/sorting/filtering validation here if needed
        // Example:
        // query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        // query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        ];
    }
}
exports.default = ConfigValidator;
