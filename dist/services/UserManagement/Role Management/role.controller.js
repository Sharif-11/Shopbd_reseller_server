"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const role_services_1 = require("./role.services");
class RoleController {
    /**
     * Get all roles in the system
     */
    getAllRoles(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const roles = yield role_services_1.roleService.getAllRoles(adminId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Roles retrieved successfully',
                    success: true,
                    data: roles,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get a single role with its permissions
     */
    getRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleId } = req.params;
                const role = yield role_services_1.roleService.getRoleWithPermissions(adminId, roleId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Role retrieved successfully',
                    success: true,
                    data: role,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all permissions available in the system
     */
    getAllPermissions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const permissions = yield role_services_1.roleService.getAllPermissions(adminId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Permissions retrieved successfully',
                    success: true,
                    data: permissions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all actions available in the system
     */
    getAllActions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const actions = yield role_services_1.roleService.getAllActions(adminId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Actions retrieved successfully',
                    success: true,
                    data: actions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Create a new role
     */
    createRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleName, description, isDefault, permissions } = req.body;
                const role = yield role_services_1.roleService.createRole(adminId, {
                    roleName,
                    description,
                    isDefault,
                    permissions,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Role created successfully',
                    success: true,
                    data: role,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update role permissions
     */
    updateRolePermissions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleId } = req.params;
                const { permissions } = req.body;
                const role = yield role_services_1.roleService.updateRolePermissions(adminId, roleId, permissions);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Role permissions updated successfully',
                    success: true,
                    data: role,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all roles assigned to a user
     */
    getUserRoles(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { userId } = req.params;
                const userRoles = yield role_services_1.roleService.getUserRoles(adminId, userId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'User roles retrieved successfully',
                    success: true,
                    data: userRoles,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update user roles
     */
    updateUserRoles(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { userId } = req.params;
                const { roleIds } = req.body;
                const userRoles = yield role_services_1.roleService.updateUserRoles(adminId, userId, roleIds);
                res.status(200).json({
                    statusCode: 200,
                    message: 'User roles updated successfully',
                    success: true,
                    data: userRoles,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a role
     */
    deleteRole(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { roleId } = req.params;
                const role = yield role_services_1.roleService.deleteRole(adminId, roleId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Role deleted successfully',
                    success: true,
                    data: role,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all permissions for a user
     */
    getUserPermissions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { userId } = req.params;
                const permissions = yield role_services_1.roleService.getUserPermissions(adminId, userId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'User permissions retrieved successfully',
                    success: true,
                    data: permissions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new RoleController();
