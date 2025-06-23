import { BlockActionType, UserType, Wallet, WalletType } from '@prisma/client'
import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import { blockServices } from '../UserManagement/Block Management/block.services'
import userManagementServices from '../UserManagement/user.services'

class WalletServices {
  /**
   * Generate Random Otp
   */
  private generateRandomOtp(length: number = 6): string {
    const digits = '0123456789'
    let otp = ''
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)]
    }
    return otp
  }
  // ==========================================
  // WALLET CREATION
  // ==========================================

  /**
   * Check duplicate wallet with name and phone number
   * @param walletName - Name of the wallet
   *  @param walletPhoneNo - Phone number associated with the wallet
   * @returns - Promise resolving to boolean indicating if duplicate exists
   */
  async isDuplicateWallet(
    walletName: string,
    walletPhoneNo: string,
  ): Promise<boolean> {
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        walletName,
        walletPhoneNo,
      },
    })
    if (existingWallet) {
      throw new ApiError(400, `Wallet already exists`)
    }
    return !!existingWallet
  }

  async createWallet(
    creatorId: string,
    input: {
      walletName: string
      walletPhoneNo: string
      walletType: WalletType
    },
  ): Promise<Wallet> {
    // Check if creator is blocked

    const user = await userManagementServices.getUserById(creatorId)
    const isBlocked = await blockServices.isUserBlocked(
      user.phoneNo,
      BlockActionType.WALLET_ADDITION,
    )
    if (isBlocked) {
      throw new ApiError(403, 'User is blocked from adding wallets')
    }
    await this.isDuplicateWallet(input.walletName, input.walletPhoneNo)

    // SYSTEM wallet specific logic
    if (input.walletType === 'SYSTEM') {
      // Only SuperAdmin can create system wallets
      await userManagementServices.verifyUserRole(
        creatorId,
        UserType.SuperAdmin,
      )
      // Check for duplicate system wallet name or phone combination

      return await prisma.wallet.create({
        data: {
          walletName: input.walletName,
          walletPhoneNo: input.walletPhoneNo,
          walletType: 'SYSTEM',
        },
      })
    }

    if (!user || user.role !== 'Seller') {
      throw new ApiError(400, 'Wallets can only be created for sellers')
    }
    console.log(`wallet length: ${JSON.stringify(user.Wallet)}`)
    if (user.Wallet.length >= config.maximumWallets) {
      throw new ApiError(
        400,
        `Seller can have maximum ${config.maximumWallets} wallets`,
      )
    }

    // Check verification status of wallet phone number
    if (user.phoneNo !== input.walletPhoneNo) {
      const walletOtp = await prisma.walletOtp.findUnique({
        where: { phoneNo: input.walletPhoneNo },
      })
      if (!walletOtp || !walletOtp.isVerified) {
        throw new ApiError(
          400,
          'Wallet phone number must be verified before creating a wallet',
        )
      }
    }

    return await prisma.wallet.create({
      data: {
        walletName: input.walletName,
        walletPhoneNo: input.walletPhoneNo,
        walletType: 'SELLER',
        userId: creatorId, // Associate with the seller
      },
    })
  }

  // ==========================================
  // WALLET FETCHING
  // ==========================================

  /**
   * Get all system wallets (for SuperAdmin)
   */
  async getAllSystemWallets(requesterId: string): Promise<Wallet[]> {
    return await prisma.wallet.findMany({
      where: { walletType: 'SYSTEM' },
    })
  }

  /**
   * Get wallets for a specific seller
   */
  async getSellerWallets(
    requesterId: string,
    phoneNo: string,
  ): Promise<Wallet[]> {
    // await userManagementServices.verifyUserPermission(
    //   requesterId,
    //   'WALLET_MANAGEMENT',
    //   'READ',
    // )
    // Admin/SuperAdmin can view any seller's wallets

    const user = await userManagementServices.getUserByPhoneNo(phoneNo)
    const requester = await userManagementServices.getUserById(requesterId)
    if (!user) {
      throw new ApiError(404, 'Seller not found')
    }
    // Regular users can only view their own wallets
    if (requesterId !== user.userId) {
      if (
        !requester ||
        !(requester.role === 'Admin' || requester.role === 'SuperAdmin')
      ) {
        throw new ApiError(403, 'Unauthorized to view these wallets')
      } else {
        console.log(
          `Requester is ${requester.role}, allowing access to seller wallets`,
        )
        // If requester is not the owner, verify permission
        await userManagementServices.verifyUserPermission(
          requesterId,
          'WALLET_MANAGEMENT',
          'READ',
        )
      }
    }

    return await prisma.wallet.findMany({
      where: { walletType: 'SELLER', userId: user.userId },
    })
  }

  /**
   * Get wallet by ID with permission check
   */
  async getWalletById(requesterId: string, walletId: number): Promise<Wallet> {
    const wallet = await prisma.wallet.findUnique({
      where: { walletId },
    })
    if (!wallet) {
      throw new ApiError(404, 'Wallet not found')
    }

    // System wallets only visible to SuperAdmin
    if (wallet.walletType === 'SYSTEM') {
      await userManagementServices.verifyUserRole(
        requesterId,
        UserType.SuperAdmin,
      )
      return wallet
    }

    // Check if requester owns the wallet or has admin privileges
    if (wallet.userId !== requesterId) {
      await userManagementServices.verifyUserPermission(
        requesterId,
        'WALLET_MANAGEMENT',
        'READ',
      )
    }

    return wallet
  }

  // ==========================================
  // WALLET MODIFICATION
  // ==========================================

  /**
   * Update wallet information
   */
  async updateWallet(
    updaterId: string,
    walletId: number,
    updates: {
      walletName?: string
      walletPhoneNo?: string
    },
  ): Promise<Wallet> {
    const wallet = await this.getWalletById(updaterId, walletId)

    // System wallets can only be updated by SuperAdmin
    if (wallet.walletType === 'SYSTEM') {
      await userManagementServices.verifyUserRole(
        updaterId,
        UserType.SuperAdmin,
      )
    } else {
      // For seller wallets, verify update permission
      await userManagementServices.verifyUserPermission(
        updaterId,
        'WALLET_MANAGEMENT',
        'UPDATE',
      )
    }

    return await prisma.wallet.update({
      where: { walletId },
      data: updates,
    })
  }

  /**
   * Delete a wallet (admin can delete seller wallets, SuperAdmin can delete any)
   */
  async deleteWallet(deleterId: string, walletId: number): Promise<Wallet> {
    const wallet = await this.getWalletById(deleterId, walletId)

    // System wallets can only be deleted by SuperAdmin
    if (wallet.walletType === 'SYSTEM') {
      await userManagementServices.verifyUserRole(
        deleterId,
        UserType.SuperAdmin,
      )
    } else {
      // For seller wallets, verify delete permission
      await userManagementServices.verifyUserPermission(
        deleterId,
        'WALLET_MANAGEMENT',
        'DELETE',
      )
    }

    return await prisma.wallet.delete({
      where: { walletId },
    })
  }

  // ==========================================
  // WALLET VERIFICATION (SELLER WALLETS ONLY)
  // ==========================================

  /**
   * Initiate OTP verification for seller wallet
   */
  async initiateVerification(requesterId: string, walletPhoneNo: string) {
    // check is there any existing wallet with this phone number
    const requester = await userManagementServices.getUserById(requesterId)
    if (!requester) {
      throw new ApiError(404, 'Requester not found')
    }
    if (requester.phoneNo === walletPhoneNo) {
      return {
        alreadyVerified: true,
        message: 'Phone number already verified',
      }
    }

    const otpRecord = await prisma.walletOtp.findUnique({
      where: { phoneNo: walletPhoneNo },
    })
    if (otpRecord && otpRecord.isVerified) {
      return { alreadyVerified: true }
    }
    // Check if requester is alowed to create wallets
    // check if otp already exists and valid
    const isBlocked = await blockServices.isUserBlocked(
      requester.phoneNo,
      BlockActionType.WALLET_ADDITION,
    )
    if (isBlocked) {
      throw new ApiError(403, 'User is blocked from adding wallets')
    }

    if (otpRecord && otpRecord.otpExpiresAt > new Date()) {
      return {
        sendOTP: false,
        isBlocked: otpRecord.isBlocked,
        isVerified: otpRecord.isVerified,
        message: 'OTP already sent',
      }
    }
    // check totalOtp exceeds limit
    if (otpRecord && otpRecord.totalOTP >= config.maximumOtpRequests) {
      // create a block record and reset total OTP
      await prisma.$transaction(async tx => {
        await tx.walletOtp.update({
          where: { phoneNo: walletPhoneNo },
          data: {
            totalOTP: 0,
          },
        })
        // Create a block record
        await blockServices.updateUserBlockActions({
          bySystem: true,
          tx,
          adminId: requesterId, // Use requesterId as adminId for block creation
          userPhoneNo: requester.phoneNo,
          actions: [
            {
              actionType: BlockActionType.WALLET_ADDITION,
              active: true,
              expiresAt: new Date(Date.now() + config.otpBlockDuration),
            },
          ],
        })
      })

      throw new ApiError(403, 'Maximum OTP requests exceeded for this wallet')
    }

    // Generate and send OTP
    const otp = this.generateRandomOtp()
    const otpExpiresAt = new Date(Date.now() + config.otpExpiresIn)
    const newOtpRecord = {
      phoneNo: walletPhoneNo,
      otp,
      otpExpiresAt,
      otpCreatedAt: new Date(), // Add the required otpCreatedAt field
      totalOTP: (otpRecord?.totalOTP || 0) + 1,
      failedAttempts: 0,
      isBlocked: false,
      isVerified: false,
    }
    // Create or update OTP record
    await prisma.walletOtp.upsert({
      where: { phoneNo: walletPhoneNo },
      update: newOtpRecord,
      create: newOtpRecord,
    })

    // await SmsServices.sendOtp(walletPhoneNo, otp)
    console.log(`Sending OTP ${otp} to ${walletPhoneNo}`)
    return {
      sendOTP: true,
      isBlocked: false,
      isVerified: otpRecord?.isVerified || false,
      message: 'OTP sent successfully',
    }
  }

  /**
   * Verify OTP for seller wallet
   */
  async verifyWallet(requesterId: string, walletPhoneNo: string, otp: string) {
    // Check if requester is allowed to verify wallets

    const user = await userManagementServices.getUserById(requesterId)
    const isBlocked = await blockServices.isUserBlocked(
      user.phoneNo,
      BlockActionType.WALLET_ADDITION,
    )
    if (isBlocked) {
      throw new ApiError(
        403,
        'আপনি ওয়ালেট যাচাইকরণ থেকে ব্লক করা হয়েছে। অনুগ্রহ করে সাপোর্টের সাথে যোগাযোগ করুন',
      )
    }
    const otpRecord = await prisma.walletOtp.findUnique({
      where: { phoneNo: walletPhoneNo },
    })

    if (!otpRecord) {
      throw new ApiError(400, 'OTP not requested for this wallet')
    }

    if (otpRecord.isVerified) {
      return {
        alreadyVerified: true,
      }
    }

    if (otpRecord.isBlocked) {
      throw new ApiError(
        403,
        'Wallet verification is blocked due to too many attempts',
      )
    }

    if (!otpRecord.otp || !otpRecord.otpExpiresAt) {
      throw new ApiError(400, 'OTP not properly initialized')
    }

    if (new Date() > otpRecord.otpExpiresAt) {
      throw new ApiError(400, 'OTP has expired')
    }

    if (otpRecord.otp !== otp) {
      if (otpRecord.failedAttempts + 1 >= config.maximumOtpAttempts) {
        console.log(`Blocking wallet verification for user: ${user?.phoneNo}`)
        // we need to create a block record and reset the otp  failed attempts within a transaction
        await prisma.$transaction(async tx => {
          await tx.walletOtp.update({
            where: { phoneNo: walletPhoneNo },
            data: {
              failedAttempts: 0,
            },
          })
          // Create a block record
          await blockServices.updateUserBlockActions({
            userPhoneNo: user.phoneNo,
            actions: [
              {
                actionType: BlockActionType.WALLET_ADDITION,
                active: true,
                expiresAt: new Date(Date.now() + config.otpBlockDuration),
                reason: 'Too many failed OTP attempts',
              },
            ],
            bySystem: true,
            tx,
            adminId: requesterId, // Use requesterId as adminId for block creation
          })
        })
        throw new ApiError(
          403,
          'অনেকবার ভুল চেষ্টা করেছেন। ওয়ালেট যাচাইকরণ ২৪ ঘন্টার জন্য ব্লক করা হয়েছে',
        )
      } else {
        // Increment failed attempts
        await prisma.walletOtp.update({
          where: { phoneNo: walletPhoneNo },
          data: {
            failedAttempts: otpRecord.failedAttempts + 1,
          },
        })
        throw new ApiError(400, 'Invalid OTP')
      }
    }

    // Mark as verified
    await prisma.walletOtp.update({
      where: { phoneNo: walletPhoneNo },
      data: { isVerified: true },
    })

    return { isVerified: true, message: 'Wallet verified successfully' }
  }
  /**
   * Reset Seller Wallet Verification by Admin
   * @param adminId - ID of the admin performing the reset
   * @param walletId - ID of the wallet to reset
   */
  async resetWalletVerification(adminId: string, walletPhoneNo: string) {
    // Verify admin role
    await userManagementServices.verifyUserRole(
      adminId,
      UserType.Admin || UserType.SuperAdmin,
    )
    // verify permission
    await userManagementServices.verifyUserPermission(
      adminId,
      'WALLET_MANAGEMENT',
      'UPDATE',
    )

    // Reset wallet verification
    await prisma.walletOtp.update({
      where: { phoneNo: walletPhoneNo },
      data: {
        isVerified: false,
        failedAttempts: 0,
        totalOTP: 0,
        isBlocked: false,
      },
    })

    return { message: 'Wallet verification reset successfully' }
  }
  async checkWalletOwnership(
    requesterId: string,
    walletPhoneNo: string,
    walletName: string,
  ): Promise<boolean> {
    const wallet = await prisma.wallet.findFirst({
      where: {
        walletPhoneNo,
        userId: requesterId,
        walletName, // Optional: Check wallet name if needed
      },
    })
    if (!wallet) {
      throw new ApiError(404, 'Wallet not found or not owned by user')
    }
    return true
  }
}

export default new WalletServices()
