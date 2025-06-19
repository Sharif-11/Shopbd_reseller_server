// ==========================================
// TYPE DEFINITIONS
// ==========================================

import {
  ActionType,
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
      const adminPermissions = config.defaultAdminPermissions

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
      const userData = {
        phoneNo: input.phoneNo,
        name: input.name,
        password: hashedPassword,
        email: input.email,
        role: UserType.Seller,
        isVerified: false,
        zilla: input.zilla,
        upazilla: input.upazilla,
        address: input.address,
        shopName: input.shopName,
        nomineePhone: input.nomineePhone,
        facebookProfileLink: input.facebookProfileLink,
        ...(referredByPhone
          ? {
              referredBy: {
                connect: { phoneNo: referredByPhone },
              },
            }
          : {}),
      }

      // Create the user
      const user = await tx.user.create({
        data: userData,
      })
      // give some default permissions to seller
      const sellerPermissions = config.defaultSellerPermissions
      for (const permission of sellerPermissions) {
        await tx.rolePermission.create({
          data: {
            roleId: sellerRole.roleId,
            permission,
            actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
          },
        })
      }

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
    // check if the customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerPhoneNo },
    })
    if (existingCustomer) {
      throw new ApiError(400, 'Customer already exists with this phone number')
    }
    // check if the phone number is a seller already
    const existingSeller = await prisma.user.findUnique({
      where: { phoneNo: customerPhoneNo },
    })
    if (existingSeller) {
      throw new ApiError(400, 'Phone number is already registered as a seller')
    }
    // check seller exists with the given sellerCode
    const seller = await prisma.user.findUnique({
      where: { referralCode: sellerCode },
    })
    if (!seller) {
      throw new ApiError(404, 'Seller not found with the provided code')
    }
    // check if the customer phone number is verified
    const verifiedPhoneNo = await otpServices.isVerified(customerPhoneNo)
    if (!verifiedPhoneNo.isVerified) {
      throw new ApiError(400, 'Customer phone number is not verified')
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
  /**
   * Make Super Admin a normal admin
   */
  async demoteSuperAdminToAdmin(currentAdminId: string, superAdminId: string) {
    // Verify current user is super admin
    await this.verifyUserRole(currentAdminId, UserType.SuperAdmin)

    // Check if the super admin exists
    const superAdmin = await prisma.user.findUnique({
      where: { userId: superAdminId, role: UserType.SuperAdmin },
      include: { userRoles: true },
    })

    if (!superAdmin) {
      throw new ApiError(404, 'Super Admin not found')
    }
    if (superAdmin.userId === currentAdminId) {
      throw new ApiError(400, 'You cannot demote yourself')
    }

    return await prisma.$transaction(async tx => {
      // Get admin role
      const adminRole = await tx.role.findUnique({
        where: { roleName: 'Admin' },
      })

      if (!adminRole) {
        throw new ApiError(404, 'Admin role not found')
      }

      // Remove all existing role assignments
      await tx.userRole.deleteMany({
        where: { userId: superAdminId },
      })

      // Assign admin role
      await tx.userRole.create({
        data: {
          userId: superAdminId,
          roleId: adminRole.roleId,
        },
      })

      // Update the user role to Admin
      const updatedUser = await tx.user.update({
        where: { userId: superAdminId },
        data: { role: UserType.Admin },
      })

      return updatedUser
    })
  }

  async promoteAdminToSuperAdmin(currentAdminId: string, adminId: string) {
    // Verify current user is super admin
    await this.verifyUserRole(currentAdminId, UserType.SuperAdmin)

    // Check if the admin exists
    const admin = await prisma.user.findUnique({
      where: { userId: adminId, role: UserType.Admin },
      include: { userRoles: true },
    })

    if (!admin) {
      throw new ApiError(404, 'Admin not found')
    }

    return await prisma.$transaction(async tx => {
      // Get super admin role
      const superAdminRole = await tx.role.findUnique({
        where: { roleName: 'SuperAdmin' },
      })

      if (!superAdminRole) {
        throw new ApiError(404, 'Super Admin role not found')
      }

      // Remove all existing role assignments
      await tx.userRole.deleteMany({
        where: { userId: adminId },
      })

      // Assign super admin role
      await tx.userRole.create({
        data: {
          userId: adminId,
          roleId: superAdminRole.roleId,
        },
      })

      // Update the user role to Super Admin
      const updatedUser = await tx.user.update({
        where: { userId: adminId },
        data: { role: UserType.SuperAdmin },
      })

      return updatedUser
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
   * Check Already Logged In User
   */
  async checkLoggedInUser(userId: string) {
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
    console.log('Generated new password:', newPassword)

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
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        referredBy: true,
        Wallet: true,
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    // Exclude password from the returned user object
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  async getUserByPhoneNo(phoneNo: string) {
    const user = await prisma.user.findUnique({
      where: { phoneNo },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        referredBy: true,
        Wallet: true,
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
  /**
   * Add Referral code to seller
   */
  async addReferralCodeToSeller(sellerId: string, referralCode: string) {
    const seller = await prisma.user.findUnique({
      where: { userId: sellerId, role: UserType.Seller },
    })
    if (!seller) {
      throw new ApiError(404, 'Seller not found')
    }
    // Check if referral code already exists
    const existingReferral = await prisma.user.findUnique({
      where: { referralCode },
    })
    if (existingReferral) {
      throw new ApiError(
        400,
        'রেফারেল কোড ইতোমধ্যে ব্যবহৃত, অনুগ্রহ করে অন্য একটি বেছে নিন'
      )
    }

    return await prisma.user.update({
      where: { userId: sellerId, role: UserType.Seller },
      data: { referralCode },
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
    console.log('assignPermissionToRole input:', input)
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
   * assign multiple permissions to a role
   */
  async assignMultiplePermissionsToRole(
    adminId: string,
    input: {
      roleId: string
      permissions: PermissionType[] // Changed from permission to permissions (array)
      actions: ActionType[]
    }
  ) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.UPDATE
    )

    // Ensure actions is always an array
    const actions = Array.isArray(input.actions)
      ? input.actions
      : [input.actions]

    // Process each permission in the array
    const results = await prisma.$transaction(
      input.permissions.map(permission => {
        return prisma.rolePermission.upsert({
          where: {
            roleId_permission: {
              roleId: input.roleId,
              permission,
            },
          },
          update: {
            actions,
          },
          create: {
            roleId: input.roleId,
            permission,
            actions,
          },
        })
      })
    )

    return results
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

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Verify user has specific role
   */
  public async verifyUserRole(
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
  public async verifyUserPermission(
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

    throw new ApiError(403, 'permission denied')
  }
  //add another helper method to test if a user is blocked for some action

  // Fetching all users with pagination, filtering by role, phone number, name along with all roles, permissions and wallets
  async getAllUsers({
    adminId,
    page = 1,
    limit = 10,
    role,
    searchTerm,
  }: {
    adminId: string
    page?: number
    limit?: number
    role?: UserType
    searchTerm?: string
  }) {
    // check permissions
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.READ
    )
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      ...(role ? { role: role } : {}),
      ...(searchTerm
        ? {
            OR: [
              { phoneNo: { contains: searchTerm, mode: 'insensitive' } },
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [users, totalCount] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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
          Wallet: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    }
  }
}

export default new UserManagementServices()
