"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../../middlewares/validation.middleware"));
const role_controller_1 = __importDefault(require("./role.controller"));
const role_validator_1 = __importDefault(require("./role.validator"));
class RoleRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Get all roles
        this.router.get('/', auth_middlewares_1.isAuthenticated, role_controller_1.default.getAllRoles);
        // Get all permissions
        this.router.get('/permissions', auth_middlewares_1.isAuthenticated, role_controller_1.default.getAllPermissions);
        // Get all actions
        this.router.get('/actions', auth_middlewares_1.isAuthenticated, role_controller_1.default.getAllActions);
        // Create a new role
        this.router.post('/', auth_middlewares_1.isAuthenticated, role_validator_1.default.createRole(), validation_middleware_1.default, role_controller_1.default.createRole);
        // Get a single role
        this.router.get('/:roleId', auth_middlewares_1.isAuthenticated, role_validator_1.default.getRole(), validation_middleware_1.default, role_controller_1.default.getRole);
        // Update role permissions
        this.router.put('/:roleId/permissions', auth_middlewares_1.isAuthenticated, role_validator_1.default.updateRolePermissions(), validation_middleware_1.default, role_controller_1.default.updateRolePermissions);
        // Delete a role
        this.router.delete('/:roleId', auth_middlewares_1.isAuthenticated, role_validator_1.default.deleteRole(), validation_middleware_1.default, role_controller_1.default.deleteRole);
        // Get user roles
        this.router.get('/user/:userId', auth_middlewares_1.isAuthenticated, role_validator_1.default.getUserRoles(), validation_middleware_1.default, role_controller_1.default.getUserRoles);
        // Update user roles
        this.router.put('/user/:userId', auth_middlewares_1.isAuthenticated, role_validator_1.default.updateUserRoles(), validation_middleware_1.default, role_controller_1.default.updateUserRoles);
        // Get user permissions
        this.router.get('/user/:userId/permissions', auth_middlewares_1.isAuthenticated, role_validator_1.default.getUserPermissions(), validation_middleware_1.default, role_controller_1.default.getUserPermissions);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new RoleRouter().getRouter();
