import { Router } from 'express'
import { isAuthenticated } from '../../../middlewares/auth.middlewares'
import validateRequest from '../../../middlewares/validation.middleware'
import roleController from './role.controller'
import RoleValidator from './role.validator'

class RoleRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Get all roles
    this.router.get('/', isAuthenticated, roleController.getAllRoles)

    // Get all permissions
    this.router.get(
      '/permissions',
      isAuthenticated,
      roleController.getAllPermissions
    )

    // Get all actions
    this.router.get('/actions', isAuthenticated, roleController.getAllActions)

    // Create a new role
    this.router.post(
      '/',
      isAuthenticated,
      RoleValidator.createRole(),
      validateRequest,
      roleController.createRole
    )

    // Get a single role
    this.router.get(
      '/:roleId',
      isAuthenticated,
      RoleValidator.getRole(),
      validateRequest,
      roleController.getRole
    )

    // Update role permissions
    this.router.put(
      '/:roleId/permissions',
      isAuthenticated,
      RoleValidator.updateRolePermissions(),
      validateRequest,
      roleController.updateRolePermissions
    )

    // Delete a role
    this.router.delete(
      '/:roleId',
      isAuthenticated,
      RoleValidator.deleteRole(),
      validateRequest,
      roleController.deleteRole
    )

    // Get user roles
    this.router.get(
      '/user/:userId',
      isAuthenticated,
      RoleValidator.getUserRoles(),
      validateRequest,
      roleController.getUserRoles
    )

    // Update user roles
    this.router.put(
      '/user/:userId',
      isAuthenticated,
      RoleValidator.updateUserRoles(),
      validateRequest,
      roleController.updateUserRoles
    )

    // Get user permissions
    this.router.get(
      '/user/:userId/permissions',
      isAuthenticated,
      RoleValidator.getUserPermissions(),
      validateRequest,
      roleController.getUserPermissions
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new RoleRouter().getRouter()
