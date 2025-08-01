"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const withdraw_controller_1 = __importDefault(require("./withdraw.controller"));
const withdraw_validator_1 = __importDefault(require("./withdraw.validator"));
class WithdrawRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Create withdraw request (User)
        this.router.post('/', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.createWithdraw(), validation_middleware_1.default, withdraw_controller_1.default.createWithdraw);
        // Cancel withdraw request (User)
        this.router.delete('/:withdrawId', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.cancelWithdraw(), validation_middleware_1.default, withdraw_controller_1.default.cancelWithdraw);
        // Approve withdraw request (Admin)
        this.router.patch('/:withdrawId/approve', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.approveWithdraw(), validation_middleware_1.default, withdraw_controller_1.default.approveWithdraw);
        // Reject withdraw request (Admin)
        this.router.patch('/:withdrawId/reject', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.rejectWithdraw(), validation_middleware_1.default, withdraw_controller_1.default.rejectWithdraw);
        // Get withdraw requests for seller
        this.router.get('/seller', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.getWithdrawsForSeller(), validation_middleware_1.default, withdraw_controller_1.default.getWithdrawsForSeller);
        // Get withdraw requests for admin
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.getWithdrawsForAdmin(), validation_middleware_1.default, withdraw_controller_1.default.getWithdrawsForAdmin);
        // Get withdraw request details
        this.router.get('/:withdrawId', auth_middlewares_1.isAuthenticated, withdraw_validator_1.default.getWithdrawDetails(), validation_middleware_1.default, withdraw_controller_1.default.getWithdrawDetails);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new WithdrawRouter().getRouter();
