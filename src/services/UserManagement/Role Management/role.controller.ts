import { NextFunction, Request, Response } from 'express'
import { roleService } from './role.services'

class RoleController {
  /**
   * Get all roles in the system
   */
  async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const roles = await roleService.getAllRoles(adminId!)

      res.status(200).json({
        statusCode: 200,
        message: 'Roles retrieved successfully',
        success: true,
        data: roles,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get a single role with its permissions
   */
  async getRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { roleId } = req.params

      const role = await roleService.getRoleWithPermissions(adminId!, roleId)

      res.status(200).json({
        statusCode: 200,
        message: 'Role retrieved successfully',
        success: true,
        data: role,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all permissions available in the system
   */
  async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const permissions = await roleService.getAllPermissions(adminId!)

      res.status(200).json({
        statusCode: 200,
        message: 'Permissions retrieved successfully',
        success: true,
        data: permissions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all actions available in the system
   */
  async getAllActions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const actions = await roleService.getAllActions(adminId!)

      res.status(200).json({
        statusCode: 200,
        message: 'Actions retrieved successfully',
        success: true,
        data: actions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { roleName, description, isDefault, permissions } = req.body

      const role = await roleService.createRole(adminId!, {
        roleName,
        description,
        isDefault,
        permissions,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Role created successfully',
        success: true,
        data: role,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { roleId } = req.params
      const { permissions } = req.body

      const role = await roleService.updateRolePermissions(
        adminId!,
        roleId,
        permissions
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Role permissions updated successfully',
        success: true,
        data: role,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { userId } = req.params

      const userRoles = await roleService.getUserRoles(adminId!, userId)

      res.status(200).json({
        statusCode: 200,
        message: 'User roles retrieved successfully',
        success: true,
        data: userRoles,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user roles
   */
  async updateUserRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { userId } = req.params
      const { roleIds } = req.body

      const userRoles = await roleService.updateUserRoles(
        adminId!,
        userId,
        roleIds
      )

      res.status(200).json({
        statusCode: 200,
        message: 'User roles updated successfully',
        success: true,
        data: userRoles,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { roleId } = req.params

      const role = await roleService.deleteRole(adminId!, roleId)

      res.status(200).json({
        statusCode: 200,
        message: 'Role deleted successfully',
        success: true,
        data: role,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { userId } = req.params

      const permissions = await roleService.getUserPermissions(adminId!, userId)

      res.status(200).json({
        statusCode: 200,
        message: 'User permissions retrieved successfully',
        success: true,
        data: permissions,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new RoleController()
