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
import otpServices from '../Utility Services/otp.services'

import SmsServices from '../Utility Services/Sms Service/sms.services'
import { blockServices } from './Block Management/block.services'
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
    phoneNo: string,
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
            actions: Object.values(ActionType).filter(
              action => action !== ActionType.ALL,
            ),
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
    input: CreateSuperAdminInput,
  ): Promise<Omit<User, 'password'>> {
    // Verify current user is super admin
    const currentAdmin = await this.verifyUserRole(
      currentAdminId,
      UserType.SuperAdmin,
    )

    const hashedPassword = await this.hashPassword(input.password)

    // Validate phone number and email uniqueness
    await this.validateUserInput(input.phoneNo, input.email)

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

      // Check if permissions already exist for this role
      const existingPermissions = await tx.rolePermission.findMany({
        where: { roleId: superAdminRole.roleId },
      })

      // Only assign all permissions if they don't exist
      if (existingPermissions.length === 0) {
        const allPermissions = Object.values(PermissionType)
        await tx.rolePermission.createMany({
          data: allPermissions.map(permission => ({
            roleId: superAdminRole.roleId,
            permission,
            actions: Object.values(ActionType).filter(
              action => action !== ActionType.ALL && action !== 'NOTIFY',
            ), // Assign all actions except ALL
          })),
          skipDuplicates: true,
        })
      }

      // return user without password
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }
  async checkSuperAdminExists(): Promise<boolean> {
    const superAdmin = await prisma.user.findFirst({
      where: { role: UserType.SuperAdmin },
    })
    return !!superAdmin
  }

  async createAdmin(
    currentAdminId: string,
    input: CreateAdminInput,
  ): Promise<Omit<User, 'password'>> {
    // Verify current user is super admin
    const currentAdmin = await this.verifyUserRole(
      currentAdminId,
      UserType.SuperAdmin,
    )

    const hashedPassword = await this.hashPassword(input.password)

    // Validate phone number and email uniqueness
    await this.validateUserInput(input.phoneNo, input.email)

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

      // Check if permissions already exist for this role
      const existingPermissions = await tx.rolePermission.findMany({
        where: { roleId: adminRole.roleId },
      })

      // Only assign default admin permissions if they don't exist
      if (existingPermissions.length === 0) {
        const adminPermissions = config.defaultAdminPermissions
        await tx.rolePermission.createMany({
          data: adminPermissions.map(permission => ({
            roleId: adminRole.roleId,
            permission,
            actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
          })),
          skipDuplicates: true,
        })
      }

      // return user without password
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }

  // Helper method for input validation
  private async validateUserInput(
    phoneNo: string,
    email?: string,
  ): Promise<void> {
    // Check if phone number is already registered
    const existingUser = await prisma.user.findUnique({
      where: { phoneNo },
    })
    if (existingUser) {
      throw new ApiError(400, 'Phone number is already registered')
    }

    // Check email unique constraint if provided
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })
      if (existingEmail) {
        throw new ApiError(400, 'Email is already used by another user')
      }
    }
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

    // Check if the phone number is already registered
    const existingSeller = await prisma.user.findUnique({
      where: { phoneNo: input.phoneNo },
    })
    if (existingSeller) {
      throw new ApiError(400, 'Phone number is already registered as a seller')
    }

    // Check email unique constraint
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

      // Check if permissions already exist for this role
      const existingPermissions = await tx.rolePermission.findMany({
        where: { roleId: sellerRole.roleId },
      })

      // Only create default permissions if they don't exist
      if (existingPermissions.length === 0) {
        const sellerPermissions = config.defaultSellerPermissions
        await tx.rolePermission.createMany({
          data: sellerPermissions.map(permission => ({
            roleId: sellerRole.roleId,
            permission,
            actions: [ActionType.CREATE, ActionType.READ, ActionType.UPDATE],
          })),
          skipDuplicates: true,
        })
      }

      // Create the user
      const user = await tx.user.create({
        data: {
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
        },
      })

      // Assign role to user
      await tx.userRole.create({
        data: {
          userId: user.userId,
          roleId: sellerRole.roleId,
        },
      })

      // Return user without password
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })
  }

  /**
   * Create a new customer
   */
  async createCustomer({
    customerPhoneNo,
    sellerCode,
  }: {
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

    const customer = await prisma.customer.create({
      data: {
        customerPhoneNo,
        sellerCode,
        role: 'Customer',
        sellerId: seller.userId,
        sellerName: seller.name,
        sellerPhone: seller.phoneNo,
      },
    })
    const token = this.generateAccessToken(
      customer.customerId,
      customer.role,
      customer.customerPhoneNo,
    )
    return { customer, token }
  }

  public async getCustomerByPhoneNo({
    customerPhoneNo,
  }: {
    customerPhoneNo: string
  }): Promise<Prisma.CustomerGetPayload<{}> | null> {
    const customer = await prisma.customer.findUnique({
      where: { customerPhoneNo },
    })
    if (!customer) {
      throw new ApiError(404, 'Customer not found')
    }
    return customer
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
    if (user.role !== 'Seller') {
      throw new ApiError(403, 'আপনি  সেলার নন')
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

    const token = this.generateAccessToken(user.userId, user.role, user.phoneNo)
    const { password, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,
      token,
    }
  }
  async adminLogin(input: LoginInput) {
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
    if (user.role === 'Seller') {
      throw new ApiError(403, 'আপনি অ্যাডমিন নন')
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
    const isBlocked = await blockServices.isUserBlocked(
      user.phoneNo,
      BlockActionType.PASSWORD_RESET,
    )
    if (isBlocked) {
      throw new ApiError(
        403,
        'আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার সুবিধা বন্ধ করা হয়েছে। অনুগ্রহ করে সাপোর্টের সাথে যোগাযোগ করুন।',
      )
    }
    if (
      user.totalPasswordResetRequests >= config.maxForgotPasswordAttempts &&
      user.role !== UserType.SuperAdmin
    ) {
      if (user.role === 'Seller') {
        // create a  block action for the seller and reset totalPasswordResetRequests within transaction
        await prisma.$transaction(async tx => {
          await blockServices.createBlockRecordBySystem({
            userPhoneNo: user.phoneNo,
            actions: [
              {
                actionType: BlockActionType.PASSWORD_RESET,
                active: true,
                reason: 'Exceeded maximum password reset attempts',
              },
            ],
            tx,
          })
          await tx.user.update({
            where: { phoneNo },
            data: { totalPasswordResetRequests: 0 },
          })
        })
        throw new ApiError(
          403,
          'আপনার অ্যাকাউন্টের পাসওয়ার্ড রিসেট করার সুবিধা বন্ধ করা হয়েছে। অনুগ্রহ করে সাপোর্টের সাথে যোগাযোগ করুন।',
        )
      }

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

    const updatedUser = await prisma.$transaction(async tx => {
      await SmsServices.sendPassword(user.phoneNo, newPassword)
      const updatedUser = await tx.user.update({
        where: { phoneNo },
        data: {
          password: hashedPassword,
          passwordSendsAt: new Date(),
          totalPasswordResetRequests: { increment: 1 },
        },
      })
      return updatedUser
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
  async updateSuperAdminPhoneNo(userId: string, newPhoneNo: string) {
    const user = await prisma.user.findUnique({
      where: { userId, role: UserType.SuperAdmin },
    })
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    await prisma.user.update({
      where: { userId },
      data: { phoneNo: newPhoneNo },
    })
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
  async getUserDetailByIdForWalletManagement(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId, role: UserType.Seller },
      select: {
        userId: true,
        name: true,
        phoneNo: true,
        email: true,
        zilla: true,
        upazilla: true,
        address: true,
        shopName: true,
        nomineePhone: true,
        balance: true,
        Wallet: {
          select: {
            walletId: true,
            walletName: true,
            walletPhoneNo: true,
            walletType: true,
          },
        },
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    return user
  }
  async getUserByIdWithLock(userId: string) {
    await prisma.$executeRaw`SELECT * FROM "users" WHERE "userId" = ${userId} FOR UPDATE`
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
    return user
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
  async sendDirectMessage(adminId: string, userId: string, content: string) {
    // check if the admin has permission to send messages
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.ALL,
    )
    // check if the user exists
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        phoneNo: true,
        name: true,
      },
    })
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    const message = `Message from Shop Bd Reseller Jobs: ${content}`
    // send the message using SmsServices
    const result = await SmsServices.sendSingleSms(user.phoneNo, message)
    if (!result) {
      throw new ApiError(500, 'Failed to send message')
    }
    return content
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { password, ...userWithoutPassword } = await prisma.user.update({
      where: { userId },
      data: {
        ...input,
      },
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
    if (seller.referralCode) {
      throw new ApiError(400, 'Seller already has a referral code')
    }
    // Check if referral code already exists
    const existingReferral = await prisma.user.findUnique({
      where: { referralCode },
    })
    if (existingReferral) {
      throw new ApiError(
        400,
        'রেফারেল কোড ইতোমধ্যে ব্যবহৃত, অনুগ্রহ করে অন্য একটি বেছে নিন',
      )
    }

    return await prisma.user.update({
      where: { userId: sellerId, role: UserType.Seller },
      data: { referralCode },
    })
  }
  async verifySeller({
    tx,
    userId,
    userPhoneNo,
  }: {
    tx: Prisma.TransactionClient
    userId?: string
    userPhoneNo?: string
  }) {
    if (!userId && !userPhoneNo) {
      throw new ApiError(400, 'Either userId or userPhoneNo must be provided')
    }

    const user = await tx.user.findUnique({
      where: {
        userId: userId || undefined,
        phoneNo: userPhoneNo || undefined,
      },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    if (user.role !== UserType.Seller) {
      throw new ApiError(403, 'Only sellers can be verified')
    }

    return await tx.user.update({
      where: { userId: user.userId },
      data: { isVerified: true },
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
      ActionType.CREATE,
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
      ActionType.UPDATE,
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
   * assign multiple permissions to a role
   */
  async assignMultiplePermissionsToRole(
    adminId: string,
    input: {
      roleId: string
      permissions: PermissionType[] // Changed from permission to permissions (array)
      actions: ActionType[]
    },
  ) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.UPDATE,
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
      }),
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
      ActionType.UPDATE,
    )

    return await prisma.userRole.create({
      data: {
        userId: input.userId,
        roleId: input.roleId,
      },
    })
  }
  async getSmsRecipientsForPermission(
    permission: PermissionType,
    actionType: ActionType = ActionType.NOTIFY,
  ): Promise<string[]> {
    const users = await this.getUsersWithPermission(permission, actionType)
    if (!users || users.length === 0) {
      throw new ApiError(404, 'No users found with the specified permission')
    }
    return users.map(user => user.phoneNo)
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
    requiredRole: UserType,
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
   * Get All Admin and Super Admin with specific role from role and userRole tables and user table, here role is dynamic
   */
  public async getUsersWithRole(roleId: string) {
    const existingRole = await prisma.role.findUnique({
      where: { roleId },
    })
    if (!existingRole) {
      throw new ApiError(404, 'Role not found')
    }
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            roleId,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    })
    return users
  }
  public async getUsersWithPermission(
    permission: PermissionType,
    actionType: ActionType,
  ): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              permissions: {
                some: {
                  permission,
                  actions: {
                    has: actionType === ActionType.ALL ? undefined : actionType,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  where: {
                    permission,
                    actions:
                      actionType === ActionType.ALL
                        ? {}
                        : {
                            has: actionType,
                          },
                  },
                },
              },
            },
          },
        },
      },
    })

    return users
  }

  /**
   * Verify user has specific permission
   */
  public async verifyUserPermission(
    userId: string,
    permission: PermissionType,
    action: ActionType,
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
    role?: UserType | UserType[]
    searchTerm?: string
  }) {
    // check permissions
    await this.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.READ,
    )
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {
      ...(role
        ? Array.isArray(role)
          ? { role: { in: role } }
          : { role: role }
        : {}),
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
  async getUserStatisticsForAdmin(adminId: string) {
    await this.verifyUserPermission(
      adminId,
      PermissionType.DASHBOARD_ANALYTICS,
      ActionType.READ,
    )

    // Calculate date boundaries once
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch all data in parallel
    const [allUsers, allCustomers] = await Promise.all([
      prisma.user.findMany(),
      prisma.customer.findMany(),
    ])

    // Process user data
    let totalSellers = 0
    let totalAdmins = 0
    let totalSuperAdmins = 0
    let totalVerifiedSellers = 0
    let totalUnverifiedSellers = 0
    let last30DaysUsers = 0
    let last7DaysUsers = 0

    for (const user of allUsers) {
      // Count by role
      if (user.role === 'Seller') totalSellers++
      if (user.role === 'Admin') totalAdmins++
      if (user.role === 'SuperAdmin') totalSuperAdmins++

      // Count seller verification status
      if (user.role === 'Seller') {
        if (user.isVerified) {
          totalVerifiedSellers++
        } else {
          totalUnverifiedSellers++
        }
      }

      // Count recent users
      if (user.createdAt >= thirtyDaysAgo) last30DaysUsers++
      if (user.createdAt >= sevenDaysAgo) last7DaysUsers++
    }

    return {
      totalUsers: allUsers.length,
      totalSellers,
      totalCustomers: allCustomers.length,
      totalAdmins,
      totalSuperAdmins,
      totalVerifiedSellers,
      totalUnverifiedSellers,
      totalUsersLast30Days: last30DaysUsers,
      totalUsersLast7Days: last7DaysUsers,
    }
  }
}

export default new UserManagementServices()
