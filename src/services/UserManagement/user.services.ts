// ==========================================
// TYPE DEFINITIONS
// ==========================================

import {
  ActionType,
  BlockActionType,
  PermissionType,
  Prisma,
  User,
  UserType,
} from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import otpServices from '../otp/otp.services'

import {
  AssignPermissionInput,
  AssignRoleInput,
  BlockUserInput,
  ChangePasswordInput,
  CreateAdminInput,
  CreateRoleInput,
  CreateSuperAdminInput,
  LoginInput,
  UpdateProfileInput,
} from './user.interfaces'

class UserManagementServices {
  // create a private method to hash passwords
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Number(config.saltRounds))
  }
  private async comparePassword({
    password,
    hash,
  }: {
    password: string
    hash: string
  }) {
    return bcrypt.compare(password, hash)
  }
  private generateRandomPassword(length: number = 6): string {
    // the password must be numeric
    const digits = '0123456789'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += digits.charAt(Math.floor(Math.random() * digits.length))
    }
    return password
  }
  private generateAccessToken(
    userId: string,
    role: string,
    phoneNo: string
  ): string {
    const payload = { userId, role, phoneNo }
    return jwt.sign(payload, config.jwtSecret as string) // Token expires in 1 hour
  }
  // ==========================================
  // USER CREATION METHODS
  // ==========================================

  /**
   * Create the first super admin (special method for initial setup)
   */
  async createFirstSuperAdmin(input: CreateSuperAdminInput) {
    // Check if any super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: UserType.SuperAdmin },
    })

    if (existingSuperAdmin) {
      throw new ApiError(400, 'A Super Admin already exists')
    }

    const hashedPassword = await this.hashPassword(input.password)

    return await prisma.$transaction(async tx => {
      // Create super admin role if not exists
      const superAdminRole = await tx.role.upsert({
        where: { roleName: 'SuperAdmin' },
        update: {},
        create: {
          roleName: 'SuperAdmin',
          roleDescription: 'System super administrator with all permissions',
          isDefault: false,
        },
      })

      // Create the user
      const user = await tx.user.create({
        data: {
          phoneNo: input.phoneNo,
          name: input.name,
          password: hashedPassword,
          email: input.email,
          role: UserType.SuperAdmin,
          isVerified: true,
        },
      })

      // Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.userId,
          roleId: superAdminRole.roleId,
        },
      })

      // Assign all permissions to super admin role
      const allPermissions = Object.values(PermissionType)
      for (const permission of allPermissions) {
        await tx.rolePermission.create({
          data: {
            roleId: superAdminRole.roleId,
            permission,
            actions: [ActionType.ALL],
          },
        })
      }
      // return user without password
      const { password, ...userWithoutPassword } = user

      return userWithoutPassword
    })
  }

  /**
   * Create a new super admin (can only be done by existing super admin)
   */
  async createSuperAdmin(
    currentAdminId: string,
    input: CreateSuperAdminInput
  ): Promise<Omit<User, 'password'>> {
    // Verify current user is super admin
    const currentAdmin = await this.verifyUserRole(
      currentAdminId,
      UserType.SuperAdmin
    )

    const hashedPassword = await this.hashPassword(input.password)

    return await prisma.$transaction(async tx => {
      // Get or create super admin role
      const superAdminRole = await tx.role.upsert({
        where: { roleName: 'SuperAdmin' },
        update: {},
        create: {
          roleName: 'SuperAdmin',
          roleDescription: 'System super administrator with all permissions',
          isDefault: false,
        },
      })

      // Create the user
      const user = await tx.user.create({
        data: {
          phoneNo: input.phoneNo,
          name: input.name,
          password: hashedPassword,
          email: input.email,
          role: UserType.SuperAdmin,
          isVerified: true,
        },
      })

      // Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.userId,
          roleId: superAdminRole.roleId,
        },
      })
      // Assign all permissions to super admin role
      const allPermissions = Object.values(PermissionType)

      for (const permission of allPermissions) {
        await tx.rolePermission.create({
          data: {
            roleId: superAdminRole.roleId,
            permission,
            actions: [ActionType.ALL],
          },
        })
      }
      // return user without password
      const { password, ...userWithoutPassword } = user

      return userWithoutPassword
    })
  }

  /**
   * Create a new admin (can be done by super admin)
   */
  async createAdmin(
    currentAdminId: string,
    input: CreateAdminInput
  ): Promise<User> {
    // Verify current user is super admin
    const currentAdmin = await this.verifyUserRole(
      currentAdminId,
      UserType.SuperAdmin
    )

    const hashedPassword = await this.hashPassword(input.password)

    return await prisma.$transaction(async tx => {
      // Get or create admin role
      const adminRole = await tx.role.upsert({
        where: { roleName: 'Admin' },
        update: {},
        create: {
          roleName: 'Admin',
          roleDescription: 'System administrator with limited permissions',
          isDefault: false,
        },
      })

      // Create the user
      const user = await tx.user.create({
        data: {
          phoneNo: input.phoneNo,
          name: input.name,
          password: hashedPassword,
          email: input.email,
          role: UserType.Admin,
          isVerified: true,
        },
      })

      // Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.userId,
          roleId: adminRole.roleId,
        },
      })

      // Assign basic admin permissions
      const adminPermissions = [
        PermissionType.PRODUCT_MANAGEMENT,
        PermissionType.ORDER_MANAGEMENT,
      ]

      for (const permission of adminPermissions) {
        await tx.rolePermission.create({
          data: {
            roleId: adminRole.roleId,
            permission,
            actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
          },
        })
      }

      return user
    })
  }

  /**
   * Create a new seller with optional referral code
   */
  async createSeller(input: Prisma.UserCreateInput) {
    const hashedPassword = await this.hashPassword(input.password)

    const verifiedPhoneNo = await otpServices.isVerified(input.phoneNo)
    if (!verifiedPhoneNo.isVerified) {
      throw new ApiError(400, 'Phone number is not verified')
    }
    // check if the phone number is already registered as a seller
    const existingSeller = await prisma.user.findUnique({
      where: { phoneNo: input.phoneNo },
    })
    if (existingSeller) {
      throw new ApiError(400, 'Phone number is already registered as a seller')
    }
    // check email unique constraint
    if (input.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: input.email },
      })
      if (existingEmail) {
        throw new ApiError(400, 'Email is already used by another user')
      }
    }
    let referredByPhone: string | null = null

    if (input.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: input.referralCode },
        select: { phoneNo: true },
      })

      if (!referrer) {
        throw new ApiError(400, 'Invalid referral code')
      }

      referredByPhone = referrer.phoneNo
    }

    return await prisma.$transaction(async tx => {
      // Handle referral if provided

      // Get or create seller role
      const sellerRole = await tx.role.upsert({
        where: { roleName: 'Seller' },
        update: {},
        create: {
          roleName: 'Seller',
          roleDescription: 'Regular seller account',
          isDefault: true,
        },
      })

      // Create the user
      const user = await tx.user.create({
        data: {
          ...input,
          password: hashedPassword,
          role: UserType.Seller,
          isVerified: false,
          // Set referredBy relation correctly if referredByPhone exists
          ...(referredByPhone
            ? {
                referredBy: {
                  connect: { phoneNo: referredByPhone },
                },
              }
            : {}),
          // Ensure these required fields are present
          zilla: input.zilla,
          upazilla: input.upazilla,
          address: input.address,
          shopName: input.shopName,
        },
      })

      // Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.userId,
          roleId: sellerRole.roleId,
        },
      })

      // return user without password
      const { password, ...userWithoutPassword } = user

      return userWithoutPassword
    })
  }

  /**
   * Create a new customer
   */
  async createCustomer({
    customerName,
    customerPhoneNo,
    sellerCode,
  }: {
    customerName: string
    customerPhoneNo: string
    sellerCode: string
  }) {
    // check seller exists with the given sellerCode
    const seller = await prisma.user.findUnique({
      where: { referralCode: sellerCode },
    })
    if (!seller) {
      throw new ApiError(404, 'Seller not found with the provided code')
    }
    return await prisma.customer.create({
      data: {
        customerName,
        customerPhoneNo,
        sellerCode,
        role: 'Customer',
        sellerId: seller.userId,
        sellerName: seller.name,
        sellerPhone: seller.phoneNo,
      },
    })
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  /**
   * Login with phone and password
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { phoneNo: input.phoneNo },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const isPasswordValid = await this.comparePassword({
      password: input.password,
      hash: user.password,
    })
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials')
    }

    // Check if user is blocked
    // const block = await prisma.block.findFirst({
    //   where: {
    //     userPhoneNo: user.phoneNo,
    //     isActive: true,
    //     actionTypes: {
    //       has: BlockActionType.,
    //     },
    //     expiresAt: { gt: new Date() },
    //   },
    // })

    // if (block) {
    //   throw new ApiError(403, 'Your account is currently blocked')
    // }
    console.log('user login.....', user)
    const token = this.generateAccessToken(user.userId, user.role, user.phoneNo)
    const { password, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,
      token,
    }
  }

  /**
   * Reset password (forgot password flow)
   */
  async resetPassword(phoneNo: string) {
    const user = await prisma.user.findUnique({
      where: { phoneNo },
    })
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    if (user.totalPasswordResetRequests >= config.maxForgotPasswordAttempts) {
      throw new ApiError(403, 'Maximum password reset requests exceeded')
    }
    // if passwordSendsAt is within the last 5 minutes, throw an error

    if (user.passwordSendsAt) {
      const timeElapsed = Date.now() - user.passwordSendsAt.getTime()
      if (timeElapsed < config.forgotPasswordRequestInterval) {
        throw new ApiError(403, `A password is already sent to this number.`)
      }
    }
    const newPassword = this.generateRandomPassword()

    const hashedPassword = await this.hashPassword(newPassword)

    // await smsServices.sendSms({ phoneNo: user.phoneNo, message: `Your new password is: ${newPassword}` })
    const updatedUser = await prisma.user.update({
      where: { phoneNo },
      data: {
        password: hashedPassword,
        passwordSendsAt: new Date(),
        totalPasswordResetRequests: { increment: 1 },
      },
    })

    const { password, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  }

  // ==========================================
  // PROFILE MANAGEMENT
  // ==========================================

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        referredBy: true,
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    // Exclude password from the returned user object
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { password, ...userWithoutPassword } = await prisma.user.update({
      where: { userId },
      data: input,
    })
    return userWithoutPassword
  }

  /**
   * Change password
   */
  async changePassword(input: ChangePasswordInput): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { userId: input.userId },
    })
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const isPasswordValid = await this.comparePassword({
      password: input.currentPassword,
      hash: user.password,
    })
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect')
    }

    const hashedPassword = await this.hashPassword(input.newPassword)

    return await prisma.user.update({
      where: { userId: input.userId },
      data: { password: hashedPassword },
    })
  }

  // ==========================================
  // ROLE & PERMISSION MANAGEMENT
  // ==========================================

  /**
   * Create a new role
   */
  async createRole(creatorId: string, input: CreateRoleInput) {
    await this.verifyUserPermission(
      creatorId,
      PermissionType.USER_MANAGEMENT,
      ActionType.CREATE
    )

    return await prisma.role.create({
      data: {
        roleName: input.roleName,
        roleDescription: input.description,
        isDefault: input.isDefault || false,
      },
    })
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(adminId: string, input: AssignPermissionInput) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.UPDATE
    )

    return await prisma.rolePermission.upsert({
      where: {
        roleId_permission: {
          roleId: input.roleId,
          permission: input.permission,
        },
      },
      update: {
        actions: input.actions,
      },
      create: {
        roleId: input.roleId,
        permission: input.permission,
        actions: input.actions,
      },
    })
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(adminId: string, input: AssignRoleInput) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.UPDATE
    )

    return await prisma.userRole.create({
      data: {
        userId: input.userId,
        roleId: input.roleId,
      },
    })
  }

  // ==========================================
  // BLOCK MANAGEMENT
  // ==========================================

  /**
   * Block a user
   */
  async blockUser(adminId: string, input: BlockUserInput) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.BLOCK
    )

    const user = await prisma.user.findUnique({
      where: { phoneNo: input.userPhoneNo },
    })
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    return await prisma.block.create({
      data: {
        userPhoneNo: input.userPhoneNo,
        userName: user.name,
        reason: input.reason,
        actionTypes: input.actionTypes,
        expiresAt: input.expiresAt,
        isActive: true,
      },
    })
  }

  /**
   * Unblock a user
   */
  async unblockUser(adminId: string, blockId: string) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.BLOCK
    )

    return await prisma.block.update({
      where: { blockId },
      data: { isActive: false },
    })
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Verify user has specific role
   */
  private async verifyUserRole(
    userId: string,
    requiredRole: UserType
  ): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { userRoles: true },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    if (user.role !== requiredRole) {
      throw new ApiError(403, 'Insufficient privileges')
    }

    return user
  }

  /**
   * Verify user has specific permission
   */
  private async verifyUserPermission(
    userId: string,
    permission: PermissionType,
    action: ActionType
  ): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // Super admin has all permissions
    if (user.role === UserType.SuperAdmin) {
      return user
    }

    // Check permissions for other users
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        if (
          rolePermission.permission === permission ||
          rolePermission.permission === PermissionType.ALL
        ) {
          if (
            rolePermission.actions.includes(action) ||
            rolePermission.actions.includes(ActionType.ALL)
          ) {
            return user
          }
        }
      }
    }

    throw new ApiError(403, 'Insufficient permissions')
  }
  //add another helper method to test if a user is blocked for some action
  async isUserBlocked(
    userPhoneNo: string,
    actionType: BlockActionType
  ): Promise<boolean> {
    const block = await prisma.block.findFirst({
      where: {
        userPhoneNo,
        isActive: true,
        AND: [
          {
            OR: [
              { actionTypes: { has: actionType } },
              { actionTypes: { has: BlockActionType.ALL } }, // Check for ALL action type
            ],
          },
          {
            OR: [
              { expiresAt: { gt: new Date() } },
              { expiresAt: null }, // Handle never-expiring blocks
            ],
          },
        ],
      },
    })
    return !!block
  }
}

export default new UserManagementServices()
