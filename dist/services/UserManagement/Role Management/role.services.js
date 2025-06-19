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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../utils/prisma"));
const user_services_1 = __importDefault(require("../../UserManagement/user.services"));
class RoleService {
    /**
     * Get all roles in the system
     */
    getAllRoles(adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify permission (assuming you have this method)
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.READ);
            return yield prisma_1.default.role.findMany({
                where: {
                    roleName: {
                        notIn: ['SuperAdmin', 'Seller'],
                    },
                },
                include: {
                    permissions: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
        });
    }
    /**
     * Get a single role with its permissions
     */
    getRoleWithPermissions(adminId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.READ);
            return yield prisma_1.default.role.findUnique({
                where: { roleId },
                include: {
                    permissions: true,
                },
            });
        });
    }
    /**
     * Get all permissions available in the system
     */
    getAllPermissions(adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.READ);
            return Object.values(client_1.PermissionType);
        });
    }
    /**
     * Get all actions available in the system
     */
    getAllActions(adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.READ);
            return Object.values(client_1.ActionType);
        });
    }
    /**
     * Create a new role with optional permissions
     */
    createRole(creatorId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(creatorId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.CREATE);
            try {
                return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // First check if role name exists
                    const existingRole = yield tx.role.findUnique({
                        where: { roleName: input.roleName },
                    });
                    if (existingRole) {
                        throw new Error(`Role with name '${input.roleName}' already exists`);
                    }
                    const role = yield tx.role.create({
                        data: {
                            roleName: input.roleName,
                            roleDescription: input.description,
                            isDefault: input.isDefault || false,
                        },
                    });
                    if (input.permissions && input.permissions.length > 0) {
                        // Check for duplicate permissions in the input
                        const permissionTypes = input.permissions.map(p => p.permission);
                        if (new Set(permissionTypes).size !== permissionTypes.length) {
                            throw new Error('Duplicate permission types in request');
                        }
                        yield tx.rolePermission.createMany({
                            data: input.permissions.map(p => ({
                                roleId: role.roleId,
                                permission: p.permission,
                                actions: p.actions,
                            })),
                        });
                    }
                    return tx.role.findUnique({
                        where: { roleId: role.roleId },
                        include: { permissions: true },
                    });
                }));
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * Update role permissions in bulk
     */
    updateRolePermissions(adminId, roleId, permissions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.UPDATE);
            try {
                return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Check for duplicate permissions in the input
                    const permissionTypes = permissions.map(p => p.permission);
                    if (new Set(permissionTypes).size !== permissionTypes.length) {
                        throw new Error('Duplicate permission types in request');
                    }
                    yield tx.rolePermission.deleteMany({
                        where: { roleId },
                    });
                    if (permissions.length > 0) {
                        yield tx.rolePermission.createMany({
                            data: permissions.map(p => ({
                                roleId,
                                permission: p.permission,
                                actions: p.actions,
                            })),
                        });
                    }
                    return tx.role.findUnique({
                        where: { roleId },
                        include: { permissions: true },
                    });
                }));
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * Get all roles assigned to a user
     */
    getUserRoles(adminId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.READ);
            return yield prisma_1.default.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            permissions: true,
                        },
                    },
                },
            });
        });
    }
    /**
     * Update user roles in bulk
     */
    updateUserRoles(adminId, userId, roleIds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.UPDATE);
            try {
                return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Remove duplicates from input
                    const uniqueRoleIds = [...new Set(roleIds)];
                    yield tx.userRole.deleteMany({
                        where: { userId },
                    });
                    if (uniqueRoleIds.length > 0) {
                        yield tx.userRole.createMany({
                            data: uniqueRoleIds.map(roleId => ({
                                userId,
                                roleId,
                            })),
                        });
                    }
                    return tx.userRole.findMany({
                        where: { userId },
                        include: {
                            role: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    });
                }));
            }
            catch (error) {
                throw error;
            }
        });
    }
    /**
     * Delete a role (only if not assigned to any users)
     */
    deleteRole(adminId, roleId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.DELETE);
            // Check if role is assigned to any users
            const userRoles = yield prisma_1.default.userRole.count({
                where: { roleId },
            });
            if (userRoles > 0) {
                throw new Error('Cannot delete role that is assigned to users');
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // First delete all permissions for this role
                yield tx.rolePermission.deleteMany({
                    where: { roleId },
                });
                // Then delete the role
                return tx.role.delete({
                    where: { roleId },
                });
            }));
        });
    }
    /**
     * Get all permissions with actions for a user
     */
    getUserPermissions(adminId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ROLE_PERMISSIONS, client_1.ActionType.READ);
            const userRoles = yield prisma_1.default.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            permissions: true,
                        },
                    },
                },
            });
            // Combine all permissions from all roles
            const permissionsMap = new Map();
            userRoles.forEach(userRole => {
                userRole.role.permissions.forEach(permission => {
                    if (!permissionsMap.has(permission.permission)) {
                        permissionsMap.set(permission.permission, new Set());
                    }
                    permission.actions.forEach(action => {
                        var _a;
                        (_a = permissionsMap.get(permission.permission)) === null || _a === void 0 ? void 0 : _a.add(action);
                    });
                });
            });
            // Convert to array format
            return Array.from(permissionsMap.entries()).map(([permission, actions]) => ({
                permission,
                actions: Array.from(actions),
            }));
        });
    }
}
exports.roleService = new RoleService();
