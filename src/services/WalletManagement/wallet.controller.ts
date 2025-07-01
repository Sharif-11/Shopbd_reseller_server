import { NextFunction, Request, Response } from 'express'
import walletServices from './wallet.services'

class WalletController {
  /**
   * Create a new wallet
   */
  async createWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletName, walletPhoneNo, walletType = 'SELLER' } = req.body
      const creatorId = req.user?.userId // From auth middleware

      const wallet = await walletServices.createWallet(creatorId!, {
        walletName,
        walletPhoneNo,
        walletType,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Wallet created successfully',
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all system wallets (SuperAdmin only)
   */
  async getSystemWallets(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.user?.userId
      const wallets = await walletServices.getAllSystemWallets(requesterId!)

      res.status(200).json({
        statusCode: 200,
        message: 'System wallets retrieved successfully',
        success: true,
        data: wallets,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get wallets for a specific seller
   */
  async getSellerWallets(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.user?.userId
      const { phoneNo } = req.params

      const wallets = await walletServices.getSellerWallets(
        requesterId!,
        phoneNo,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Seller wallets retrieved successfully',
        success: true,
        data: wallets,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get wallet by ID
   */
  async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.user?.userId
      const { walletId } = req.params

      const wallet = await walletServices.getWalletById(
        requesterId!,
        parseInt(walletId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Wallet retrieved successfully',
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update wallet information
   */
  async updateWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const updaterId = req.user?.userId
      const { walletId } = req.params
      const { walletName, walletPhoneNo } = req.body

      const wallet = await walletServices.updateWallet(
        updaterId!,
        parseInt(walletId),
        { walletName, walletPhoneNo },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Wallet updated successfully',
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }
  async updateWalletStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updaterId = req.user?.userId
      const { walletId } = req.params
      const { isActive } = req.body

      const wallet = await walletServices.updateWalletStatus(
        updaterId!,
        parseInt(walletId),
        isActive,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Wallet status updated successfully',
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a wallet
   */
  async deleteWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const deleterId = req.user?.userId
      const { walletId } = req.params

      const wallet = await walletServices.deleteWallet(
        deleterId!,
        parseInt(walletId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Wallet deleted successfully',
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Initiate wallet verification OTP
   */
  async initiateVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.user?.userId
      const { walletPhoneNo } = req.body

      const result = await walletServices.initiateVerification(
        requesterId!,
        walletPhoneNo,
      )

      res.status(200).json({
        statusCode: 200,
        message: result.sendOTP
          ? 'OTP sent successfully'
          : result.message || 'Verification initiated',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Verify wallet with OTP
   */
  async verifyWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.user?.userId
      const { walletPhoneNo, otp } = req.body

      const result = await walletServices.verifyWallet(
        requesterId!,
        walletPhoneNo,
        otp,
      )

      res.status(200).json({
        statusCode: 200,
        message:
          result.isVerified || result.alreadyVerified
            ? 'Wallet verified successfully'
            : 'Verification failed',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
  async resetWalletVerification(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const requesterId = req.user?.userId
      const { walletPhoneNo } = req.params

      const result = await walletServices.resetWalletVerification(
        requesterId!,
        walletPhoneNo,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Wallet verification reset successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new WalletController()
