import { Router } from 'express'
import { isAuthenticated } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import walletControllers from './wallet.controller'
import WalletValidator from './wallet.validator'

class WalletRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Wallet CRUD routes
    this.router.post(
      '/',
      isAuthenticated,
      WalletValidator.createWallet(),
      validateRequest,
      walletControllers.createWallet
    )

    this.router.get(
      '/system',
      isAuthenticated,
      walletControllers.getSystemWallets
    )

    this.router.get(
      '/seller/:sellerId',
      isAuthenticated,
      WalletValidator.sellerIdParam(),
      validateRequest,
      walletControllers.getSellerWallets
    )

    this.router.get(
      '/:walletId',
      isAuthenticated,
      WalletValidator.walletIdParam(),
      validateRequest,
      walletControllers.getWallet
    )

    this.router.patch(
      '/:walletId',
      isAuthenticated,
      WalletValidator.updateWallet(),
      validateRequest,
      walletControllers.updateWallet
    )

    this.router.delete(
      '/:walletId',
      isAuthenticated,
      WalletValidator.walletIdParam(),
      validateRequest,
      walletControllers.deleteWallet
    )

    // Wallet verification routes
    this.router.post(
      '/send-otp',
      isAuthenticated,
      WalletValidator.sendOtp(),
      validateRequest,
      walletControllers.initiateVerification
    )

    this.router.post(
      '/verify-otp',
      isAuthenticated,
      WalletValidator.verifyOtp(),
      validateRequest,
      walletControllers.verifyWallet
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new WalletRouter().getRouter()
