// routes/auth.route.ts
import { Router } from 'express'
import validateRequest from '../../middlewares/validation.middleware'
import userManagementControllers from '../UserManagement/user.controller'
import UserManagementValidator from '../UserManagement/user.validator'
import authControllers from './auth.controllers'
import AuthValidator from './auth.validator'

class AuthRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Authentication routes
    this.router.post(
      '/send-otp',
      AuthValidator.sendOtp(),
      validateRequest,
      authControllers.sendOtp
    )

    this.router.post(
      '/verify-otp',
      AuthValidator.verifyOtp(),
      validateRequest,
      authControllers.verifyOtp
    )

    this.router.get(
      '/check-verification',
      AuthValidator.checkVerification(),
      validateRequest,
      authControllers.checkVerification
    )

    this.router.patch(
      '/unblock-contact',
      AuthValidator.unblockContact(),
      validateRequest,
      authControllers.unblockContact
    )

    // User management routes
    this.initializeUserManagementRoutes()
  }

  protected initializeUserManagementRoutes(): void {
    // Super Admin routes
    this.router.post(
      '/super-admin',
      UserManagementValidator.createFirstSuperAdmin(),
      validateRequest,
      userManagementControllers.createFirstSuperAdmin
    )

    // Admin routes (require authentication)
    this.router.post(
      '/admin',
      UserManagementValidator.createAdmin(),
      validateRequest,
      userManagementControllers.createAdmin
    )

    // Seller routes
    this.router.post(
      '/seller',
      UserManagementValidator.createSeller(),
      validateRequest,
      userManagementControllers.createSeller
    )

    // Customer routes
    this.router.post(
      '/customer',
      UserManagementValidator.createCustomer(),
      validateRequest,
      userManagementControllers.createCustomer
    )

    // Login route
    this.router.post(
      '/login',
      UserManagementValidator.login(),
      validateRequest,
      userManagementControllers.login
    )

    // Password reset
    this.router.post(
      '/reset-password',
      UserManagementValidator.resetPassword(),
      validateRequest,
      userManagementControllers.resetPassword
    )

    // Profile management (require authentication)
    this.router.get(
      '/profile',
      UserManagementValidator.getProfile(),
      validateRequest,
      userManagementControllers.getProfile
    )

    this.router.patch(
      '/profile',
      UserManagementValidator.updateProfile(),
      validateRequest,
      userManagementControllers.updateProfile
    )

    this.router.post(
      '/change-password',
      UserManagementValidator.changePassword(),
      validateRequest,
      userManagementControllers.changePassword
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new AuthRouter().getRouter()
