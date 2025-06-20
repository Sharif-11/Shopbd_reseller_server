"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class SmsValidator {
    /**
     * Validation rules for sending generic SMS
     */
    static sendSms() {
        return [
            (0, express_validator_1.body)('recipients')
                .notEmpty()
                .withMessage('Recipient(s) required')
                .custom(value => {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error('At least one recipient required');
                    }
                    // Validate each phone number in the array
                    value.forEach(phone => {
                        if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone)) {
                            throw new Error('Invalid Bangladeshi phone number format');
                        }
                    });
                }
                else if (typeof value === 'string') {
                    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(value)) {
                        throw new Error('Invalid Bangladeshi phone number format');
                    }
                }
                else {
                    throw new Error('Recipients must be string or array of strings');
                }
                return true;
            }),
            (0, express_validator_1.body)('message')
                .notEmpty()
                .withMessage('Message content required')
                .isString()
                .withMessage('Message must be a string')
                .trim()
                .isLength({ min: 1, max: 1600 }) // Assuming max 10 SMS concatenated
                .withMessage('Message must be between 1 and 1600 characters'),
        ];
    }
    /**
     * Validation rules for sending OTP
     */
    static sendOtp() {
        return [
            (0, express_validator_1.body)('recipients')
                .notEmpty()
                .withMessage('Recipient(s) required')
                .custom(value => {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error('At least one recipient required');
                    }
                    value.forEach(phone => {
                        if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone)) {
                            throw new Error('Invalid Bangladeshi phone number format');
                        }
                    });
                }
                else if (typeof value === 'string') {
                    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(value)) {
                        throw new Error('Invalid Bangladeshi phone number format');
                    }
                }
                else {
                    throw new Error('Recipients must be string or array of strings');
                }
                return true;
            }),
            (0, express_validator_1.body)('otp')
                .notEmpty()
                .withMessage('OTP required')
                .isString()
                .withMessage('OTP must be a string')
                .isLength({ min: 4, max: 8 })
                .withMessage('OTP must be between 4 and 8 characters'),
        ];
    }
    /**
     * Validation rules for sending password
     */
    static sendPassword() {
        return [
            (0, express_validator_1.body)('recipients').custom(value => {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error('At least one recipient required');
                    }
                    value.forEach(phone => {
                        if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone)) {
                            throw new Error('Invalid Bangladeshi phone number format');
                        }
                    });
                }
                else if (typeof value === 'string') {
                    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(value)) {
                        throw new Error('Invalid Bangladeshi phone number format');
                    }
                }
                else {
                    throw new Error('Recipients must be string or array of strings');
                }
                return true;
            }),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .withMessage('Password required')
                .isString()
                .withMessage('Password must be a string'),
        ];
    }
    /**
     * Validation rules for order notification
     */
    static orderNotification() {
        return [
            (0, express_validator_1.body)('recipients')
                .notEmpty()
                .withMessage('Recipient(s) required')
                .custom(value => {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error('At least one recipient required');
                    }
                    value.forEach(phone => {
                        if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone)) {
                            throw new Error('Invalid Bangladeshi phone number format');
                        }
                    });
                }
                else if (typeof value === 'string') {
                    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(value)) {
                        throw new Error('Invalid Bangladeshi phone number format');
                    }
                }
                else {
                    throw new Error('Recipients must be string or array of strings');
                }
                return true;
            }),
            (0, express_validator_1.body)('orderId')
                .notEmpty()
                .withMessage('Order ID required')
                .isInt({ min: 1 })
                .withMessage('Order ID must be a positive integer'),
        ];
    }
    /**
     * Validation rules for withdrawal notification
     */
    static withdrawalNotification() {
        return [
            (0, express_validator_1.body)('recipients')
                .notEmpty()
                .withMessage('Recipient(s) required')
                .custom(value => {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error('At least one recipient required');
                    }
                    value.forEach(phone => {
                        if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone)) {
                            throw new Error('Invalid Bangladeshi phone number format');
                        }
                    });
                }
                else if (typeof value === 'string') {
                    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(value)) {
                        throw new Error('Invalid Bangladeshi phone number format');
                    }
                }
                else {
                    throw new Error('Recipients must be string or array of strings');
                }
                return true;
            }),
            (0, express_validator_1.body)('sellerName')
                .notEmpty()
                .withMessage('Seller name required')
                .isString()
                .withMessage('Seller name must be a string')
                .trim()
                .isLength({ min: 2, max: 100 })
                .withMessage('Seller name must be between 2 and 100 characters'),
            (0, express_validator_1.body)('sellerPhoneNo')
                .notEmpty()
                .withMessage('Seller phone number required')
                .matches(/^(?:\+88|88)?(01[3-9]\d{8})$/)
                .withMessage('Invalid Bangladeshi phone number format'),
            (0, express_validator_1.body)('amount')
                .notEmpty()
                .withMessage('Amount required')
                .isFloat({ min: 1 })
                .withMessage('Amount must be a positive number'),
        ];
    }
    /**
     * Validation rules for order status updates
     */
    static orderStatus() {
        return [
            (0, express_validator_1.body)('recipients')
                .notEmpty()
                .withMessage('Recipient(s) required')
                .custom(value => {
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        throw new Error('At least one recipient required');
                    }
                    value.forEach(phone => {
                        if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(phone)) {
                            throw new Error('Invalid Bangladeshi phone number format');
                        }
                    });
                }
                else if (typeof value === 'string') {
                    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(value)) {
                        throw new Error('Invalid Bangladeshi phone number format');
                    }
                }
                else {
                    throw new Error('Recipients must be string or array of strings');
                }
                return true;
            }),
            (0, express_validator_1.body)('orderId')
                .notEmpty()
                .withMessage('Order ID required')
                .isInt({ min: 1 })
                .withMessage('Order ID must be a positive integer'),
            (0, express_validator_1.body)('status')
                .notEmpty()
                .withMessage('Status required')
                .isIn(['processed', 'shipped', 'delivered', 'cancelled'])
                .withMessage('Invalid status value'),
            (0, express_validator_1.body)('trackingUrl')
                .optional()
                .isURL()
                .withMessage('Tracking URL must be a valid URL'),
        ];
    }
}
exports.default = SmsValidator;
