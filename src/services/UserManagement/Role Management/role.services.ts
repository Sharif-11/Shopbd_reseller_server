import { ActionType, PermissionType } from '@prisma/client'
import prisma from '../../../utils/prisma'
import userManagementServices from '../../UserManagement/user.services'

class RoleService {
  /**
   * Get all roles in the system
   */
  async getAllRoles(adminId: string) {
    // Verify permission (assuming you have this method)
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.READ
    )

    return await prisma.role.findMany({
      where: {
        roleName: {
          notIn: ['SuperAdmin', 'Seller', 'Admin'],
        },
      },
      include: {
        permissions: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })
  }

  /**
   * Get a single role with its permissions
   */
  async getRoleWithPermissions(adminId: string, roleId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.READ
    )

    return await prisma.role.findUnique({
      where: { roleId },
      include: {
        permissions: true,
      },
    })
  }

  /**
   * Get all permissions available in the system
   */
  async getAllPermissions(adminId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.READ
    )

    return Object.values(PermissionType)
  }

  /**
   * Get all actions available in the system
   */
  async getAllActions(adminId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.READ
    )

    return Object.values(ActionType)
  }

  /**
   * Create a new role with optional permissions
   */
  async createRole(
    creatorId: string,
    input: {
      roleName: string
      description?: string
      isDefault?: boolean
      permissions?: {
        permission: PermissionType
        actions: ActionType[]
      }[]
    }
  ) {
    await userManagementServices.verifyUserPermission(
      creatorId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.CREATE
    )

    try {
      return await prisma.$transaction(async tx => {
        // First check if role name exists
        const existingRole = await tx.role.findUnique({
          where: { roleName: input.roleName },
        })

        if (existingRole) {
          throw new Error(`Role with name '${input.roleName}' already exists`)
        }

        const role = await tx.role.create({
          data: {
            roleName: input.roleName,
            roleDescription: input.description,
            isDefault: input.isDefault || false,
          },
        })

        if (input.permissions && input.permissions.length > 0) {
          // Check for duplicate permissions in the input
          const permissionTypes = input.permissions.map(p => p.permission)
          if (new Set(permissionTypes).size !== permissionTypes.length) {
            throw new Error('Duplicate permission types in request')
          }

          await tx.rolePermission.createMany({
            data: input.permissions.map(p => ({
              roleId: role.roleId,
              permission: p.permission,
              actions: p.actions,
            })),
          })
        }

        return tx.role.findUnique({
          where: { roleId: role.roleId },
          include: { permissions: true },
        })
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Update role permissions in bulk
   */
  async updateRolePermissions(
    adminId: string,
    roleId: string,
    permissions: {
      permission: PermissionType
      actions: ActionType[]
    }[]
  ) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.UPDATE
    )

    try {
      return await prisma.$transaction(async tx => {
        // Check for duplicate permissions in the input
        const permissionTypes = permissions.map(p => p.permission)
        if (new Set(permissionTypes).size !== permissionTypes.length) {
          throw new Error('Duplicate permission types in request')
        }

        await tx.rolePermission.deleteMany({
          where: { roleId },
        })

        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map(p => ({
              roleId,
              permission: p.permission,
              actions: p.actions,
            })),
          })
        }

        return tx.role.findUnique({
          where: { roleId },
          include: { permissions: true },
        })
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(adminId: string, userId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.READ
    )

    return await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })
  }

  /**
   * Update user roles in bulk
   */
  async updateUserRoles(adminId: string, userId: string, roleIds: string[]) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.UPDATE
    )

    try {
      return await prisma.$transaction(async tx => {
        // Remove duplicates from input
        const uniqueRoleIds = [...new Set(roleIds)]

        await tx.userRole.deleteMany({
          where: { userId },
        })

        if (uniqueRoleIds.length > 0) {
          await tx.userRole.createMany({
            data: uniqueRoleIds.map(roleId => ({
              userId,
              roleId,
            })),
          })
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
        })
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete a role (only if not assigned to any users)
   */
  async deleteRole(adminId: string, roleId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.DELETE
    )

    // Check if role is assigned to any users
    const userRoles = await prisma.userRole.count({
      where: { roleId },
    })

    if (userRoles > 0) {
      throw new Error('Cannot delete role that is assigned to users')
    }

    return await prisma.$transaction(async tx => {
      // First delete all permissions for this role
      await tx.rolePermission.deleteMany({
        where: { roleId },
      })

      // Then delete the role
      return tx.role.delete({
        where: { roleId },
      })
    })
  }

  /**
   * Get all permissions with actions for a user
   */
  async getUserPermissions(adminId: string, userId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.ROLE_PERMISSIONS,
      ActionType.READ
    )

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    // Combine all permissions from all roles
    const permissionsMap = new Map<PermissionType, Set<ActionType>>()

    userRoles.forEach(userRole => {
      userRole.role.permissions.forEach(permission => {
        if (!permissionsMap.has(permission.permission)) {
          permissionsMap.set(permission.permission, new Set())
        }
        permission.actions.forEach(action => {
          permissionsMap.get(permission.permission)?.add(action)
        })
      })
    })

    // Convert to array format
    return Array.from(permissionsMap.entries()).map(
      ([permission, actions]) => ({
        permission,
        actions: Array.from(actions),
      })
    )
  }

  /**
   * Verify if a user has a specific permission with action
   */
}

export const roleService = new RoleService()
