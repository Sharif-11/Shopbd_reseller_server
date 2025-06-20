"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../../middlewares/validation.middleware"));
const sms_controller_1 = __importDefault(require("./sms.controller"));
const sms_validator_1 = __importDefault(require("./sms.validator"));
class SmsRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Basic SMS sending routes
        this.router.post('/send', sms_controller_1.default.sendSms);
        // OTP related routes
        this.router.post('/send-otp', sms_controller_1.default.sendOtp);
        // Password related routes
        this.router.post('/send-password', sms_validator_1.default.sendPassword(), validation_middleware_1.default, sms_controller_1.default.sendPassword);
        // Order notification routes
        this.router.post('/order-notification', sms_validator_1.default.orderNotification(), validation_middleware_1.default, sms_controller_1.default.sendOrderNotification);
        // Withdrawal request notification
        this.router.post('/withdrawal-notification', auth_middlewares_1.isAuthenticated, sms_validator_1.default.withdrawalNotification(), validation_middleware_1.default, sms_controller_1.default.sendWithdrawalNotification);
        // Order status updates
        this.router.post('/order-status', auth_middlewares_1.isAuthenticated, sms_validator_1.default.orderStatus(), validation_middleware_1.default, sms_controller_1.default.sendOrderStatus);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new SmsRouter().getRouter();
