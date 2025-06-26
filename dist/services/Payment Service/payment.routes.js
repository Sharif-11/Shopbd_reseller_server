"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const payment_controller_1 = __importDefault(require("./payment.controller"));
const payment_validator_1 = __importDefault(require("./payment.validator"));
class PaymentRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Payment creation routes
        // Admin payment management routes
        this.router.post('/admin/verify/:paymentId', auth_middlewares_1.isAuthenticated, payment_validator_1.default.verifyPaymentByAdmin(), validation_middleware_1.default, payment_controller_1.default.verifyPaymentByAdmin);
        // Payment retrieval routes
        this.router.get('/user/:userPhoneNo', auth_middlewares_1.isAuthenticated, payment_validator_1.default.getAllPaymentsOfAUser(), validation_middleware_1.default, payment_controller_1.default.getAllPaymentsOfAUser);
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, payment_validator_1.default.getAllPaymentsForAdmin(), validation_middleware_1.default, payment_controller_1.default.getAllPaymentsForAdmin);
        this.router.post('/seller/pay-due', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), payment_validator_1.default.payDueBySeller(), validation_middleware_1.default, payment_controller_1.default.createDuePayment);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new PaymentRouter().getRouter();
