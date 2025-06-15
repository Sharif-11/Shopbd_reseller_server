import {
  BlockActionType,
  PermissionType,
  UserType,
  Wallet,
  WalletType,
} from '@prisma/client'
import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
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
    walletPhoneNo: string
  ): Promise<boolean> {
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        walletName,
        walletPhoneNo,
      },
    })
    if (existingWallet) {
      throw new ApiError(
        400,
        `Wallet with name "${walletName}" and phone "${walletPhoneNo}" already exists`
      )
    }
    return !!existingWallet
  }

  async createWallet(
    creatorId: string,
    input: {
      walletName: string
      walletPhoneNo: string
      walletType: WalletType
    }
  ): Promise<Wallet> {
    // Check if creator is blocked
    // await this.checkUserBlocked(creatorId, 'WALLET_ADDITION')
    const user = await userManagementServices.getUserById(creatorId)
    await userManagementServices.isUserBlocked(
      user.phoneNo,
      BlockActionType.WALLET_ADDITION
    )
    await this.isDuplicateWallet(input.walletName, input.walletPhoneNo)

    // SYSTEM wallet specific logic
    if (input.walletType === 'SYSTEM') {
      // Only SuperAdmin can create system wallets
      await userManagementServices.verifyUserRole(
        creatorId,
        UserType.SuperAdmin
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

    // SELLER wallet logic
    // Verify creator has permission to create wallets
    await userManagementServices.verifyUserPermission(
      creatorId,
      PermissionType.WALLET_ADDITION,
      'CREATE'
    )

    if (!user || user.role !== 'Seller') {
      throw new ApiError(400, 'Wallets can only be created for sellers')
    }

    if (user.Wallet.length >= config.maximumWallets) {
      throw new ApiError(
        400,
        `Seller can have maximum ${config.maximumWallets} wallets`
      )
    }

    // Check for duplicate wallet name or phone combination

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
    sellerId: string
  ): Promise<Wallet[]> {
    // Admin/SuperAdmin can view any seller's wallets
    try {
      await userManagementServices.verifyUserRole(
        requesterId,
        UserType.Admin || UserType.SuperAdmin || UserType.Seller
      )
      // verify if requester is allowed to view seller's wallets
      await userManagementServices.verifyUserPermission(
        requesterId,
        'WALLET_MANAGEMENT',
        'READ'
      )
    } catch {
      // Regular users can only view their own wallets
      if (requesterId !== sellerId) {
        throw new ApiError(403, 'Unauthorized to view these wallets')
      }
    }

    return await prisma.wallet.findMany({
      where: { userId: sellerId, walletType: 'SELLER' },
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
        UserType.SuperAdmin
      )
      return wallet
    }

    // Check if requester owns the wallet or has admin privileges
    if (wallet.userId !== requesterId) {
      await userManagementServices.verifyUserPermission(
        requesterId,
        'WALLET_MANAGEMENT',
        'READ'
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
    }
  ): Promise<Wallet> {
    const wallet = await this.getWalletById(updaterId, walletId)

    // System wallets can only be updated by SuperAdmin
    if (wallet.walletType === 'SYSTEM') {
      await userManagementServices.verifyUserRole(
        updaterId,
        UserType.SuperAdmin
      )
    } else {
      // For seller wallets, verify update permission
      await userManagementServices.verifyUserPermission(
        updaterId,
        'WALLET_MANAGEMENT',
        'UPDATE'
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
        UserType.SuperAdmin
      )
    } else {
      // For seller wallets, verify delete permission
      await userManagementServices.verifyUserPermission(
        deleterId,
        'WALLET_MANAGEMENT',
        'DELETE'
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
  async initiateVerification(requesterId: string, walletId: number) {
    const wallet = await this.getWalletById(requesterId, walletId)

    if (wallet.walletType === 'SYSTEM') {
      throw new ApiError(400, 'System wallets do not require verification')
    }

    // Check if wallet is already verified
    const otpRecord = await prisma.walletOtp.findUnique({
      where: { phoneNo: wallet.walletPhoneNo },
    })
    if (otpRecord?.isVerified) {
      return { alreadyVerified: true }
    }
    // check if otp already exists and valid
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
      throw new ApiError(403, 'Maximum OTP requests exceeded for this wallet')
    }

    // Generate and send OTP
    const otp = this.generateRandomOtp()
    await prisma.walletOtp.upsert({
      where: { phoneNo: wallet.walletPhoneNo },
      update: {
        otp,
        otpCreatedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + config.otpExpiresIn),
        totalOTP: { increment: 1 },
        isBlocked: false,
      },
      create: {
        phoneNo: wallet.walletPhoneNo,
        otp,
        otpCreatedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + config.otpExpiresIn),
        totalOTP: 1,
      },
    })

    // await SmsServices.sendOtp(wallet.walletPhoneNo, otp)
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
  async verifyWallet(requesterId: string, walletId: number, otp: string) {
    const wallet = await this.getWalletById(requesterId, walletId)

    if (wallet.walletType === 'SYSTEM') {
      throw new ApiError(400, 'System wallets do not require verification')
    }

    const otpRecord = await prisma.walletOtp.findUnique({
      where: { phoneNo: wallet.walletPhoneNo },
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
        'Wallet verification is blocked due to too many attempts'
      )
    }

    if (!otpRecord.otp || !otpRecord.otpExpiresAt) {
      throw new ApiError(400, 'OTP not properly initialized')
    }

    if (new Date() > otpRecord.otpExpiresAt) {
      throw new ApiError(400, 'OTP has expired')
    }

    if (otpRecord.otp !== otp) {
      // Increment failed attempts and block if too many
      const updatedRecord = await prisma.walletOtp.update({
        where: { phoneNo: wallet.walletPhoneNo },
        data: {
          failedAttempts: { increment: 1 },
          isBlocked: otpRecord.failedAttempts + 1 >= config.maximumOtpAttempts,
        },
      })

      if (updatedRecord.isBlocked) {
        throw new ApiError(
          403,
          'Too many failed attempts. Wallet verification blocked.'
        )
      }
      throw new ApiError(400, 'Invalid OTP')
    }

    // Mark as verified
    await prisma.walletOtp.update({
      where: { phoneNo: wallet.walletPhoneNo },
      data: { isVerified: true },
    })

    return { isVerified: true, message: 'Wallet verified successfully' }
  }
}

export default new WalletServices()
