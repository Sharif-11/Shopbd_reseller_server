"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../../middlewares/validation.middleware"));
const transaction_controller_1 = require("./transaction.controller");
const transaction_validator_1 = __importDefault(require("./transaction.validator"));
class TransactionRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // User transactions routes
        this.router.get('/', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), transaction_validator_1.default.getUserTransactions(), validation_middleware_1.default, transaction_controller_1.transactionControllers.getUserTransactions);
        // Admin transactions routes
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, transaction_validator_1.default.getAllTransactions(), validation_middleware_1.default, transaction_controller_1.transactionControllers.getAllTransactions);
        this.router.patch('/balance/:sellerId', auth_middlewares_1.isAuthenticated, transaction_validator_1.default.updateBalanceByAdminToSeller(), validation_middleware_1.default, transaction_controller_1.transactionControllers.updateBalanceByAdminToSeller);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new TransactionRouter().getRouter();
