// routes/auth.route.ts
import { Router } from 'express'
import { isAuthenticated, verifyRole } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import {
  default as userController,
  default as userManagementControllers,
} from '../UserManagement/user.controller'
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
      authControllers.sendOtp,
    )

    this.router.post(
      '/verify-otp',
      AuthValidator.verifyOtp(),
      validateRequest,
      authControllers.verifyOtp,
    )

    this.router.get(
      '/check-verification',
      AuthValidator.checkVerification(),
      validateRequest,
      authControllers.checkVerification,
    )
    this.router.post(
      '/add-referral-code',
      isAuthenticated,
      verifyRole('Seller'),
      userController.addReferralCodeToSeller,
    )
    this.router.patch(
      '/unblock-contact',
      AuthValidator.unblockContact(),
      validateRequest,
      authControllers.unblockContact,
    )

    // User management routes
    this.initializeUserManagementRoutes()
  }

  protected initializeUserManagementRoutes(): void {
    this.router.get('/check-super-admin', userController.checkSuperAdminExists)
    // Super Admin routes
    this.router.post(
      '/first-super-admin',
      UserManagementValidator.createFirstSuperAdmin(),
      validateRequest,
      userManagementControllers.createFirstSuperAdmin,
    )
    this.router.post(
      '/super-admin',
      isAuthenticated,
      UserManagementValidator.createSuperAdmin(),
      validateRequest,
      userManagementControllers.createSuperAdmin,
    )

    // Admin routes (require authentication)
    this.router.post(
      '/admin',
      isAuthenticated,
      UserManagementValidator.createAdmin(),
      validateRequest,
      userManagementControllers.createAdmin,
    )

    // Seller routes
    this.router.post(
      '/seller',
      UserManagementValidator.createSeller(),
      validateRequest,
      userManagementControllers.createSeller,
    )

    // Customer routes
    this.router.post(
      '/customer',
      UserManagementValidator.createCustomer(),
      validateRequest,
      userManagementControllers.createCustomer,
    )
    this.router.patch(
      '/demote-super-admin',
      isAuthenticated,
      UserManagementValidator.demoteSuperAdmin(),
      validateRequest,
      userManagementControllers.demoteSuperAdmin,
    )
    this.router.patch(
      '/promote-admin',
      isAuthenticated,
      UserManagementValidator.promoteAdmin(),
      validateRequest,
      userManagementControllers.promoteAdmin,
    )

    // Login route
    this.router.post(
      '/login',
      UserManagementValidator.login(),
      validateRequest,
      userManagementControllers.login,
    )
    this.router.post(
      '/admin-login',
      UserManagementValidator.login(),
      validateRequest,
      userManagementControllers.adminLogin,
    )

    // Password reset
    this.router.post(
      '/forgot-password',
      UserManagementValidator.resetPassword(),
      validateRequest,
      userManagementControllers.resetPassword,
    )

    // Profile management (require authentication)
    this.router.get(
      '/profile',
      isAuthenticated,
      UserManagementValidator.getProfile(),
      validateRequest,

      userManagementControllers.getProfile,
    )

    this.router.patch(
      '/profile',
      isAuthenticated,
      UserManagementValidator.updateProfile(),
      validateRequest,

      userManagementControllers.updateProfile,
    )
    this.router.post(
      '/send-message/:userId',
      isAuthenticated,
      UserManagementValidator.sendDirectMessage(),
      validateRequest,

      userManagementControllers.sendDirectMessage,
    )
    this.router.patch(
      '/verify-seller/:phoneNo',
      isAuthenticated,
      UserManagementValidator.verifySellerByAdmin(),
      validateRequest,

      userManagementControllers.verifySellerByAdmin,
    )

    this.router.patch(
      '/change-password',
      isAuthenticated,
      UserManagementValidator.changePassword(),
      validateRequest,

      userManagementControllers.changePassword,
    )
    this.router.post(
      '/create-role',
      isAuthenticated,
      UserManagementValidator.createRole(),
      validateRequest,
      userManagementControllers.createRole,
    )
    // role-permissions
    this.router.post(
      '/create-role-permission',
      isAuthenticated,
      userManagementControllers.assignMultiplePermissionsToRole,
    )
    // assign role to user
    this.router.post(
      '/assign-role',
      isAuthenticated,
      UserManagementValidator.assignRoleToUser(),
      validateRequest,
      userManagementControllers.assignRoleToUser,
    )

    this.router.get(
      '/get-all-users',
      isAuthenticated,
      UserManagementValidator.getAllUsers(),
      validateRequest,
      userManagementControllers.getAllUsers,
    )
    this.router.get(
      '/referred-users',
      isAuthenticated,
      UserManagementValidator.getReferredSellersByLevel(),
      validateRequest,
      userManagementControllers.getReferredSellersByLevel,
    )
    this.router.get(
      '/get-all-customers',
      isAuthenticated,
      UserManagementValidator.getAllCustomers(),
      validateRequest,
      userManagementControllers.getAllCustomers,
    )
    this.router.get(
      '/customers/:phoneNo',
      UserManagementValidator.getCustomerByPhoneNo(),
      validateRequest,
      userManagementControllers.getCustomerByPhoneNo,
    )
    // route for logout and verify already logged in user
    this.router.post(
      '/logout',
      isAuthenticated,
      userManagementControllers.logout,
    )
    this.router.get(
      '/verify-login',
      isAuthenticated,
      userManagementControllers.checkLoggedInUser,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new AuthRouter().getRouter()
