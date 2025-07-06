"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class SupportTicketValidator {
    static createTicket() {
        return [
            (0, express_validator_1.body)('subject')
                .notEmpty()
                .withMessage('Subject is required')
                .isString()
                .withMessage('Subject must be a string')
                .isLength({ max: 200 })
                .withMessage('Subject must be less than 200 characters'),
            (0, express_validator_1.body)('category')
                .notEmpty()
                .withMessage('Category is required')
                .isIn([
                'ACCOUNT',
                'PAYMENT',
                'ORDER',
                'PRODUCT',
                'WITHDRAWAL',
                'TECHNICAL',
                'OTHER',
            ])
                .withMessage('Invalid ticket category'),
            (0, express_validator_1.body)('priority')
                .optional()
                .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
                .withMessage('Invalid ticket priority'),
            (0, express_validator_1.body)('message')
                .notEmpty()
                .withMessage('Message is required')
                .isString()
                .withMessage('Message must be a string')
                .isLength({ max: 2000 })
                .withMessage('Message must be less than 2000 characters'),
            (0, express_validator_1.body)('attachmentUrls')
                .optional()
                .isArray({ max: 5 })
                .withMessage('Maximum 5 attachments allowed')
                .custom((urls) => {
                if (urls) {
                    for (const url of urls) {
                        if (!url.match(/^https?:\/\/.+/)) {
                            throw new Error('Invalid attachment URL format');
                        }
                    }
                }
                return true;
            }),
            (0, express_validator_1.body)('orderId')
                .optional()
                .isString()
                .withMessage('Order ID must be a string'),
            (0, express_validator_1.body)('paymentId')
                .optional()
                .isString()
                .withMessage('Payment ID must be a string'),
            (0, express_validator_1.body)('productId')
                .optional()
                .isString()
                .withMessage('Product ID must be a string'),
        ];
    }
    static replyToTicket() {
        return [
            (0, express_validator_1.body)('ticketId')
                .notEmpty()
                .withMessage('Ticket ID is required')
                .isString()
                .withMessage('Ticket ID must be a string'),
            (0, express_validator_1.body)('message')
                .notEmpty()
                .withMessage('Message is required')
                .isString()
                .withMessage('Message must be a string')
                .isLength({ max: 2000 })
                .withMessage('Message must be less than 2000 characters'),
            (0, express_validator_1.body)('attachmentUrls')
                .optional()
                .isArray({ max: 5 })
                .withMessage('Maximum 5 attachments allowed')
                .custom((urls) => {
                if (urls) {
                    for (const url of urls) {
                        if (!url.match(/^https?:\/\/.+/)) {
                            throw new Error('Invalid attachment URL format');
                        }
                    }
                }
                return true;
            }),
        ];
    }
    static closeTicket() {
        return [
            (0, express_validator_1.param)('ticketId')
                .notEmpty()
                .withMessage('Ticket ID is required')
                .isString()
                .withMessage('Ticket ID must be a string'),
        ];
    }
    static getTicketDetails() {
        return [
            (0, express_validator_1.param)('ticketId')
                .notEmpty()
                .withMessage('Ticket ID is required')
                .isString()
                .withMessage('Ticket ID must be a string'),
        ];
    }
    static getUserTickets() {
        return [
            (0, express_validator_1.query)('status')
                .optional()
                .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(v => [
                        'OPEN',
                        'IN_PROGRESS',
                        'WAITING_RESPONSE',
                        'RESOLVED',
                        'CLOSED',
                    ].includes(v));
                }
                return [
                    'OPEN',
                    'IN_PROGRESS',
                    'WAITING_RESPONSE',
                    'RESOLVED',
                    'CLOSED',
                ].includes(value);
            })
                .withMessage('Invalid ticket status'),
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
                .withMessage('Search term must be a string'),
        ];
    }
    static getAllTickets() {
        return [
            (0, express_validator_1.query)('status')
                .optional()
                .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(v => [
                        'OPEN',
                        'IN_PROGRESS',
                        'WAITING_RESPONSE',
                        'RESOLVED',
                        'CLOSED',
                    ].includes(v));
                }
                return [
                    'OPEN',
                    'IN_PROGRESS',
                    'WAITING_RESPONSE',
                    'RESOLVED',
                    'CLOSED',
                ].includes(value);
            })
                .withMessage('Invalid ticket status'),
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
                .withMessage('Search term must be a string'),
            (0, express_validator_1.query)('priority')
                .optional()
                .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(v => ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(v));
                }
                return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(value);
            })
                .withMessage('Invalid ticket priority'),
            (0, express_validator_1.query)('category')
                .optional()
                .custom(value => {
                if (Array.isArray(value)) {
                    return value.every(v => [
                        'ACCOUNT',
                        'PAYMENT',
                        'ORDER',
                        'PRODUCT',
                        'WITHDRAWAL',
                        'TECHNICAL',
                        'OTHER',
                    ].includes(v));
                }
                return [
                    'ACCOUNT',
                    'PAYMENT',
                    'ORDER',
                    'PRODUCT',
                    'WITHDRAWAL',
                    'TECHNICAL',
                    'OTHER',
                ].includes(value);
            })
                .withMessage('Invalid ticket category'),
        ];
    }
}
exports.default = SupportTicketValidator;
