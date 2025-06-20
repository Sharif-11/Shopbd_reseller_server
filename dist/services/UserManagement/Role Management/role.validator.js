"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class RoleValidator {
    static getRole() {
        return [
            (0, express_validator_1.param)('roleId')
                .trim()
                .notEmpty()
                .withMessage('Role ID is required')
                .isString()
                .withMessage('Role ID must be a string'),
        ];
    }
    static createRole() {
        return [
            (0, express_validator_1.body)('roleName')
                .trim()
                .notEmpty()
                .withMessage('Role name is required')
                .isString()
                .withMessage('Role name must be a string'),
            (0, express_validator_1.body)('description')
                .optional()
                .isString()
                .withMessage('Description must be a string'),
            (0, express_validator_1.body)('isDefault')
                .optional()
                .isBoolean()
                .withMessage('isDefault must be a boolean'),
            (0, express_validator_1.body)('permissions')
                .optional()
                .isArray()
                .withMessage('Permissions must be an array'),
        ];
    }
    static updateRolePermissions() {
        return [
            (0, express_validator_1.param)('roleId')
                .trim()
                .notEmpty()
                .withMessage('Role ID is required')
                .isString()
                .withMessage('Role ID must be a string'),
            (0, express_validator_1.body)('permissions').isArray().withMessage('Permissions must be an array'),
        ];
    }
    static getUserRoles() {
        return [
            (0, express_validator_1.param)('userId')
                .trim()
                .notEmpty()
                .withMessage('User ID is required')
                .isString()
                .withMessage('User ID must be a string'),
        ];
    }
    static updateUserRoles() {
        return [
            (0, express_validator_1.param)('userId')
                .trim()
                .notEmpty()
                .withMessage('User ID is required')
                .isString()
                .withMessage('User ID must be a string'),
            (0, express_validator_1.body)('roleIds')
                .isArray()
                .withMessage('Role IDs must be an array')
                .optional(),
            (0, express_validator_1.body)('roleIds.*')
                .if((0, express_validator_1.body)('roleIds').exists())
                .isString()
                .withMessage('Role ID must be a string'),
        ];
    }
    static deleteRole() {
        return [
            (0, express_validator_1.param)('roleId')
                .trim()
                .notEmpty()
                .withMessage('Role ID is required')
                .isString()
                .withMessage('Role ID must be a string'),
        ];
    }
    static getUserPermissions() {
        return [
            (0, express_validator_1.param)('userId')
                .trim()
                .notEmpty()
                .withMessage('User ID is required')
                .isString()
                .withMessage('User ID must be a string'),
        ];
    }
}
exports.default = RoleValidator;
