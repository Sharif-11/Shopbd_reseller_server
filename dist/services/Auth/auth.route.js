"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/auth.route.ts
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
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
        this.router.post('/add-referral-code', auth_middlewares_1.isAuthenticated, (0, auth_middlewares_1.verifyRole)('Seller'), user_controller_1.default.addReferralCodeToSeller);
        this.router.patch('/unblock-contact', auth_validator_1.default.unblockContact(), validation_middleware_1.default, auth_controllers_1.default.unblockContact);
        // User management routes
        this.initializeUserManagementRoutes();
    }
    initializeUserManagementRoutes() {
        this.router.get('/check-super-admin', user_controller_1.default.checkSuperAdminExists);
        // Super Admin routes
        this.router.post('/first-super-admin', user_validator_1.default.createFirstSuperAdmin(), validation_middleware_1.default, user_controller_1.default.createFirstSuperAdmin);
        this.router.post('/super-admin', auth_middlewares_1.isAuthenticated, user_validator_1.default.createSuperAdmin(), validation_middleware_1.default, user_controller_1.default.createSuperAdmin);
        // Admin routes (require authentication)
        this.router.post('/admin', auth_middlewares_1.isAuthenticated, user_validator_1.default.createAdmin(), validation_middleware_1.default, user_controller_1.default.createAdmin);
        // Seller routes
        this.router.post('/seller', user_validator_1.default.createSeller(), validation_middleware_1.default, user_controller_1.default.createSeller);
        // Customer routes
        this.router.post('/customer', user_validator_1.default.createCustomer(), validation_middleware_1.default, user_controller_1.default.createCustomer);
        this.router.patch('/demote-super-admin', auth_middlewares_1.isAuthenticated, user_validator_1.default.demoteSuperAdmin(), validation_middleware_1.default, user_controller_1.default.demoteSuperAdmin);
        this.router.patch('/promote-admin', auth_middlewares_1.isAuthenticated, user_validator_1.default.promoteAdmin(), validation_middleware_1.default, user_controller_1.default.promoteAdmin);
        // Login route
        this.router.post('/login', user_validator_1.default.login(), validation_middleware_1.default, user_controller_1.default.login);
        this.router.post('/admin-login', user_validator_1.default.login(), validation_middleware_1.default, user_controller_1.default.adminLogin);
        // Password reset
        this.router.post('/forgot-password', user_validator_1.default.resetPassword(), validation_middleware_1.default, user_controller_1.default.resetPassword);
        // Profile management (require authentication)
        this.router.get('/profile', auth_middlewares_1.isAuthenticated, user_validator_1.default.getProfile(), validation_middleware_1.default, user_controller_1.default.getProfile);
        this.router.patch('/profile', auth_middlewares_1.isAuthenticated, user_validator_1.default.updateProfile(), validation_middleware_1.default, user_controller_1.default.updateProfile);
        this.router.patch('/change-password', auth_middlewares_1.isAuthenticated, user_validator_1.default.changePassword(), validation_middleware_1.default, user_controller_1.default.changePassword);
        this.router.post('/create-role', auth_middlewares_1.isAuthenticated, user_validator_1.default.createRole(), validation_middleware_1.default, user_controller_1.default.createRole);
        // role-permissions
        this.router.post('/create-role-permission', auth_middlewares_1.isAuthenticated, user_controller_1.default.assignMultiplePermissionsToRole);
        // assign role to user
        this.router.post('/assign-role', auth_middlewares_1.isAuthenticated, user_validator_1.default.assignRoleToUser(), validation_middleware_1.default, user_controller_1.default.assignRoleToUser);
        this.router.get('/get-all-users', auth_middlewares_1.isAuthenticated, user_validator_1.default.getAllUsers(), validation_middleware_1.default, user_controller_1.default.getAllUsers);
        // route for logout and verify already logged in user
        this.router.post('/logout', auth_middlewares_1.isAuthenticated, user_controller_1.default.logout);
        this.router.get('/verify-login', auth_middlewares_1.isAuthenticated, user_controller_1.default.checkLoggedInUser);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new AuthRouter().getRouter();
