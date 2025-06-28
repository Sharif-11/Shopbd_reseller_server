"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const commission_controller_1 = __importDefault(require("./commission.controller"));
const commission_validator_1 = __importDefault(require("./commission.validator"));
class CommissionRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Commission table management routes (admin only)
        this.router.post('/replace-table', auth_middlewares_1.isAuthenticated, commission_validator_1.default.replaceCommissionTable(), validation_middleware_1.default, commission_controller_1.default.replaceCommissionTable);
        this.router.get('/table', auth_middlewares_1.isAuthenticated, commission_controller_1.default.getCommissionTable);
        // Commission calculation routes (seller/admin)
        this.router.post('/calculate', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)(['Seller', 'Admin', 'SuperAdmin']), commission_validator_1.default.calculateCommissions(), validation_middleware_1.default, commission_controller_1.default.calculateCommissions);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new CommissionRouter().getRouter();
