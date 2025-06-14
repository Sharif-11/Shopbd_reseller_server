"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/auth.route.ts
const express_1 = require("express");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const user_controller_1 = __importDefault(require("../UserManagement/user.controller"));
const user_validator_1 = __importDefault(require("../UserManagement/user.validator"));
const auth_controllers_1 = __importDefault(require("./auth.controllers"));
const auth_validator_1 = __importDefault(require("./auth.validator"));
class AuthRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Authentication routes
        this.router.post('/send-otp', auth_validator_1.default.sendOtp(), validation_middleware_1.default, auth_controllers_1.default.sendOtp);
        this.router.post('/verify-otp', auth_validator_1.default.verifyOtp(), validation_middleware_1.default, auth_controllers_1.default.verifyOtp);
        this.router.get('/check-verification', auth_validator_1.default.checkVerification(), validation_middleware_1.default, auth_controllers_1.default.checkVerification);
        this.router.patch('/unblock-contact', auth_validator_1.default.unblockContact(), validation_middleware_1.default, auth_controllers_1.default.unblockContact);
        // User management routes
        this.initializeUserManagementRoutes();
    }
    initializeUserManagementRoutes() {
        // Super Admin routes
        this.router.post('/super-admin', user_validator_1.default.createFirstSuperAdmin(), validation_middleware_1.default, user_controller_1.default.createFirstSuperAdmin);
        // Admin routes (require authentication)
        this.router.post('/admin', user_validator_1.default.createAdmin(), validation_middleware_1.default, user_controller_1.default.createAdmin);
        // Seller routes
        this.router.post('/seller', user_validator_1.default.createSeller(), validation_middleware_1.default, user_controller_1.default.createSeller);
        // Customer routes
        this.router.post('/customer', user_validator_1.default.createCustomer(), validation_middleware_1.default, user_controller_1.default.createCustomer);
        // Login route
        this.router.post('/login', user_validator_1.default.login(), validation_middleware_1.default, user_controller_1.default.login);
        // Password reset
        this.router.post('/reset-password', user_validator_1.default.resetPassword(), validation_middleware_1.default, user_controller_1.default.resetPassword);
        // Profile management (require authentication)
        this.router.get('/profile', user_validator_1.default.getProfile(), validation_middleware_1.default, user_controller_1.default.getProfile);
        this.router.patch('/profile', user_validator_1.default.updateProfile(), validation_middleware_1.default, user_controller_1.default.updateProfile);
        this.router.post('/change-password', user_validator_1.default.changePassword(), validation_middleware_1.default, user_controller_1.default.changePassword);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new AuthRouter().getRouter();
