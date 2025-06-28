import { Router } from 'express'
import { isAuthenticated, verifyRole } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import commissionControllers from './commission.controller'
import CommissionValidator from './commission.validator'

class CommissionRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Commission table management routes (admin only)
    this.router.post(
      '/replace-table',
      isAuthenticated,
      CommissionValidator.replaceCommissionTable(),
      validateRequest,
      commissionControllers.replaceCommissionTable,
    )

    this.router.get(
      '/table',
      isAuthenticated,
      commissionControllers.getCommissionTable,
    )

    // Commission calculation routes (seller/admin)
    this.router.post(
      '/calculate',
      isAuthenticated,
      verifyRole(['Seller', 'Admin', 'SuperAdmin']),
      CommissionValidator.calculateCommissions(),
      validateRequest,
      commissionControllers.calculateCommissions,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new CommissionRouter().getRouter()
