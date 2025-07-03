"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const config_1 = __importDefault(require("../../config"));
class WithdrawValidator {
    static createWithdraw() {
        return [
            (0, express_validator_1.body)('amount')
                .notEmpty()
                .withMessage('Amount is required')
                .isFloat({ min: 0.01 })
                .withMessage('Amount must be greater than zero')
                .custom(value => {
                if (value > config_1.default.maximumWithdrawAmount) {
                    throw new Error(`Amount exceeds the maximum withdraw limit of ${config_1.default.maximumWithdrawAmount}`);
                }
                return true;
            }),
            (0, express_validator_1.body)('walletName')
                .notEmpty()
                .withMessage('Wallet name is required')
                .isString()
                .withMessage('Wallet name must be a string'),
            (0, express_validator_1.body)('walletPhoneNo')
                .notEmpty()
                .withMessage('Wallet phone number is required')
                .isString()
                .withMessage('Wallet phone number must be a string')
                .matches(/^01[3-9]\d{8}$/)
                .withMessage('Invalid Bangladeshi mobile number format'),
        ];
    }
    static cancelWithdraw() {
        return [
            (0, express_validator_1.param)('withdrawId')
                .notEmpty()
                .withMessage('Withdraw ID is required')
                .isString()
                .withMessage('Withdraw ID must be a string'),
        ];
    }
    static approveWithdraw() {
        return [
            (0, express_validator_1.param)('withdrawId')
                .notEmpty()
                .withMessage('Withdraw ID is required')
                .isString()
                .withMessage('Withdraw ID must be a string'),
            (0, express_validator_1.body)('systemWalletPhoneNo')
                .notEmpty()
                .withMessage('System wallet phone number is required')
                .isString()
                .withMessage('System wallet phone number must be a string')
                .matches(/^01[3-9]\d{8}$/)
                .withMessage('Invalid Bangladeshi mobile number format'),
            (0, express_validator_1.body)('transactionId')
                .notEmpty()
                .withMessage('Transaction ID is required')
                .isString()
                .withMessage('Transaction ID must be a string')
                .trim(),
        ];
    }
    static rejectWithdraw() {
        return [
            (0, express_validator_1.param)('withdrawId')
                .notEmpty()
                .withMessage('Withdraw ID is required')
                .isString()
                .withMessage('Withdraw ID must be a string'),
            (0, express_validator_1.body)('remarks')
                .optional()
                .isString()
                .withMessage('Remarks must be a string'),
        ];
    }
    static getWithdrawsForSeller() {
        return [
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer')
                .toInt(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100')
                .toInt(),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('Search term must be a string'),
            (0, express_validator_1.query)('status')
                .optional()
                .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(v => Object.values(client_1.WithdrawStatus).includes(v));
                }
                return Object.values(client_1.WithdrawStatus).includes(value);
            })
                .withMessage('Invalid status value'),
        ];
    }
    static getWithdrawsForAdmin() {
        return [
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer')
                .toInt(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100')
                .toInt(),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('Search term must be a string'),
            (0, express_validator_1.query)('status')
                .optional()
                .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(v => Object.values(client_1.WithdrawStatus).includes(v));
                }
                return Object.values(client_1.WithdrawStatus).includes(value);
            })
                .withMessage('Invalid status value'),
        ];
    }
    static getWithdrawDetails() {
        return [
            (0, express_validator_1.param)('withdrawId')
                .notEmpty()
                .withMessage('Withdraw ID is required')
                .isString()
                .withMessage('Withdraw ID must be a string'),
        ];
    }
}
exports.default = WithdrawValidator;
