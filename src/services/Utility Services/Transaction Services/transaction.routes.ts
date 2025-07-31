import { Router } from 'express'
import {
  isAuthenticated,
  verifyRole,
} from '../../../middlewares/auth.middlewares'
import validateRequest from '../../../middlewares/validation.middleware'
import { transactionControllers } from './transaction.controller'
import TransactionValidator from './transaction.validator'

class TransactionRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // User transactions routes
    this.router.get(
      '/',
      isAuthenticated,
      verifyRole('Seller'),
      TransactionValidator.getUserTransactions(),
      validateRequest,
      transactionControllers.getUserTransactions,
    )

    // Admin transactions routes
    this.router.get(
      '/admin',
      isAuthenticated,
      TransactionValidator.getAllTransactions(),
      validateRequest,
      transactionControllers.getAllTransactions,
    )
    this.router.patch(
      '/balance/:sellerId',
      isAuthenticated,
      TransactionValidator.updateBalanceByAdminToSeller(),
      validateRequest,
      transactionControllers.updateBalanceByAdminToSeller,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new TransactionRouter().getRouter()
