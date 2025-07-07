import { NextFunction, Request, Response } from 'express'
import config from '../../config'
import userManagementServices from './user.services'

class UserManagementController {
  /**
   * Create the first super admin (initial setup)
   */
  async createFirstSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo, name, password, email } = req.body
      const user = await userManagementServices.createFirstSuperAdmin({
        phoneNo,
        name,
        password,
        email,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Super Admin created successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new super admin
   */
  async createSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const currentAdminId = req.user?.userId // Assuming user ID is in request after auth middleware
      const { phoneNo, name, password, email } = req.body

      const user = await userManagementServices.createSuperAdmin(
        currentAdminId!,
        {
          phoneNo,
          name,
          password,
          email,
        },
      )

      res.status(201).json({
        statusCode: 201,
        message: 'Super Admin created successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new admin
   */
  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const currentAdminId = req.user?.userId
      const { phoneNo, name, password, email } = req.body

      const user = await userManagementServices.createAdmin(currentAdminId!, {
        phoneNo,
        name,
        password,
        email,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Admin created successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new seller
   */
  async createSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        phoneNo,
        name,
        password,
        email,
        zilla,
        upazilla,
        address,
        shopName,
        nomineePhone,
        facebookProfileLink,
        referralCode,
      } = req.body

      const user = await userManagementServices.createSeller({
        phoneNo,
        name,
        password,
        email,
        zilla,
        upazilla,
        address,
        shopName,
        nomineePhone,
        facebookProfileLink,
        referralCode,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Seller created successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerPhoneNo, sellerCode } = req.body

      const customer = await userManagementServices.createCustomer({
        customerPhoneNo,
        sellerCode,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Customer created successfully',
        success: true,
        data: customer,
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * Demote a super admin to admin
   */
  async demoteSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const currentAdminId = req.user?.userId
      const { superAdminId } = req.body

      const user = await userManagementServices.demoteSuperAdminToAdmin(
        currentAdminId!,
        superAdminId,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Super Admin demoted to Admin successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * Promote an admin to super admin
   */
  async promoteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const currentAdminId = req.user?.userId
      const { adminId } = req.body

      const user = await userManagementServices.promoteAdminToSuperAdmin(
        currentAdminId!,
        adminId,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Admin promoted to Super Admin successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * User login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo, password } = req.body

      const { user, token } = await userManagementServices.login({
        phoneNo,
        password,
      })
      // set token in cookie with secure and httpOnly flags
      res.cookie('token', token, {
        httpOnly: process.env.NODE_ENV === 'production', // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: config.env === 'production' ? 'none' : 'lax', // Required for cross-domain cookies
        domain:
          config.env === 'production'
            ? '.shopbdresellerjobs.shop'
            : 'localhost', // The leading dot is crucial
        path: '/', // Available on all paths
        maxAge: config.maxAge, // 1 hour expiration
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Login successful',
        success: true,
        data: {
          user,
          token,
        },
      })
    } catch (error) {
      next(error)
    }
  }
  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo, password } = req.body

      const { user, token } = await userManagementServices.adminLogin({
        phoneNo,
        password,
      })
      // set token in cookie with secure and httpOnly flags
      res.cookie('token', token, {
        httpOnly: process.env.NODE_ENV === 'production', // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: config.env === 'production' ? 'none' : 'lax', // Required for cross-domain cookies
        domain:
          config.env === 'production'
            ? '.shopbdresellerjobs.shop'
            : 'localhost', // The leading dot is crucial
        path: '/', // Available on all paths
        maxAge: config.maxAge, // 20 seconds expiration
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Login successful',
        success: true,
        data: {
          user,
          token,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * User logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear the cookie
      res.clearCookie('token')

      res.status(200).json({
        statusCode: 200,
        message: 'Logout successful',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   *  check already logged in user
   */
  async checkLoggedInUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      const user = await userManagementServices.checkLoggedInUser(userId!)

      res.status(200).json({
        statusCode: 200,
        message: 'User is logged in',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Reset password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo } = req.body

      const user = await userManagementServices.resetPassword(phoneNo)

      res.status(200).json({
        statusCode: 200,
        message: 'Password reset successful. New password sent to your phone',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      const user = await userManagementServices.getProfile(userId!)

      res.status(200).json({
        statusCode: 200,
        message: 'Profile retrieved successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { password, phoneNo, ...restInput } = req.body
      const data = {
        ...restInput,
      }
      if (req?.user?.role === 'SuperAdmin') {
        data.phoneNo = phoneNo
      }

      const user = await userManagementServices.updateProfile(userId!, {
        ...data,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Profile updated successfully',
        success: true,
        data: user,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { currentPassword, newPassword } = req.body

      const user = await userManagementServices.changePassword({
        userId: userId!,
        currentPassword,
        newPassword,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Password changed successfully',
        success: true,
        data: user,
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
      const creatorId = req.user?.userId
      const { roleName, description, isDefault } = req.body

      const role = await userManagementServices.createRole(creatorId!, {
        roleName,
        description,
        isDefault,
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
   * Assign permission to role
   */
  async assignPermissionToRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user?.userId
      const { roleId, permission, actions } = req.body

      const rolePermission =
        await userManagementServices.assignPermissionToRole(adminId!, {
          roleId,
          permission,
          actions,
        })

      res.status(200).json({
        statusCode: 200,
        message: 'Permission assigned to role successfully',
        success: true,
        data: rolePermission,
      })
    } catch (error) {
      next(error)
    }
  }
  async assignMultiplePermissionsToRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user?.userId
      const { roleId, permissions, actions } = req.body

      const rolePermissions =
        await userManagementServices.assignMultiplePermissionsToRole(adminId!, {
          roleId,
          permissions,
          actions,
        })

      res.status(200).json({
        statusCode: 200,
        message: 'Permissions assigned to role successfully',
        success: true,
        data: rolePermissions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { userId, roleId } = req.body

      const userRole = await userManagementServices.assignRoleToUser(adminId!, {
        userId,
        roleId,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Role assigned to user successfully',
        success: true,
        data: userRole,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Block a user
   */

  /**
   * Check if user is blocked for specific action
   */

  /**
   * Add referral code to the seller
   */
  async addReferralCodeToSeller(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { referralCode } = req.body
      const sellerId = req.user?.userId

      const updatedSeller =
        await userManagementServices.addReferralCodeToSeller(
          sellerId!,
          referralCode,
        )

      res.status(200).json({
        statusCode: 200,
        message: 'Referral code added successfully',
        success: true,
        data: updatedSeller,
      })
    } catch (error) {
      next(error)
    }
  }
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const currentAdminId = req.user?.userId // Assuming user ID is in request
      //after auth middleware
      const { page = 1, limit = 10, role, searchTerm } = req.query
      const users = await userManagementServices.getAllUsers({
        adminId: currentAdminId!,
        ...req.query,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Users retrieved successfully',
        success: true,
        data: users,
      })
    } catch (error) {
      next(error)
    }
  }
  async checkSuperAdminExists(req: Request, res: Response, next: NextFunction) {
    try {
      const exists = await userManagementServices.checkSuperAdminExists()

      res.status(200).json({
        statusCode: 200,
        message: 'Super Admin existence checked successfully',
        success: true,
        data: { exists },
      })
    } catch (error) {
      next(error)
    }
  }
  async sendDirectMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = req.body
      const { userId } = req.params
      const senderId = req.user?.userId

      const result = await userManagementServices.sendDirectMessage(
        senderId!,
        userId,
        content,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Message sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new UserManagementController()
