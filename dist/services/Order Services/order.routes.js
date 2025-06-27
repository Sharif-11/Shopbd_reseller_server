"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const order_controllers_1 = __importDefault(require("./order.controllers"));
const order_validator_1 = __importDefault(require("./order.validator"));
class OrderRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ==========================================
        // SELLER ORDER MANAGEMENT ROUTES
        // ==========================================
        this.router.post('/seller', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), order_validator_1.default.createSellerOrder(), validation_middleware_1.default, order_controllers_1.default.createSellerOrder);
        this.router.get('/seller', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), order_validator_1.default.getSellerOrders(), validation_middleware_1.default, order_controllers_1.default.getSellerOrders);
        this.router.post('/seller/payment', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), order_validator_1.default.orderPaymentBySeller(), validation_middleware_1.default, order_controllers_1.default.orderPaymentBySeller);
        this.router.post('/seller/cancel', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), order_validator_1.default.cancelOrderBySeller(), validation_middleware_1.default, order_controllers_1.default.cancelOrderBySeller);
        this.router.post('/seller/confirm/:orderId', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), order_validator_1.default.confirmOrderBySeller(), validation_middleware_1.default, order_controllers_1.default.confirmOrderBySeller);
        this.router.post('/seller/re-order/:orderId', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), order_controllers_1.default.reorderFailedOrder);
        // ==========================================
        // ADMIN ORDER MANAGEMENT ROUTES
        // ==========================================
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, order_validator_1.default.getSellerOrders(), validation_middleware_1.default, order_controllers_1.default.getAllOrdersForAdmin);
        this.router.post('/admin/confirm/:orderId', auth_middlewares_1.isAuthenticated, order_validator_1.default.confirmOrderByAdmin(), validation_middleware_1.default, order_controllers_1.default.confirmOrderByAdmin);
        this.router.post('/admin/deliver/:orderId', auth_middlewares_1.isAuthenticated, order_validator_1.default.deliverOrderByAdmin(), validation_middleware_1.default, order_controllers_1.default.deliverOrderByAdmin);
        this.router.post('/admin/reject/:orderId', auth_middlewares_1.isAuthenticated, order_validator_1.default.rejectOrderByAdmin(), validation_middleware_1.default, order_controllers_1.default.rejectOrderByAdmin);
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new OrderRouter().getRouter();
