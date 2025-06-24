import { Router } from 'express'
import { isAuthenticated } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import withdrawController from './withdraw.controller'
import WithdrawValidator from './withdraw.validator'

class WithdrawRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Create withdraw request (User)
    this.router.post(
      '/',
      isAuthenticated,
      WithdrawValidator.createWithdraw(),
      validateRequest,
      withdrawController.createWithdraw
    )

    // Cancel withdraw request (User)
    this.router.delete(
      '/:withdrawId',
      isAuthenticated,
      WithdrawValidator.cancelWithdraw(),
      validateRequest,
      withdrawController.cancelWithdraw
    )

    // Approve withdraw request (Admin)
    this.router.patch(
      '/:withdrawId/approve',
      isAuthenticated,
      WithdrawValidator.approveWithdraw(),
      validateRequest,
      withdrawController.approveWithdraw
    )

    // Reject withdraw request (Admin)
    this.router.patch(
      '/:withdrawId/reject',
      isAuthenticated,
      WithdrawValidator.rejectWithdraw(),
      validateRequest,
      withdrawController.rejectWithdraw
    )

    // Get withdraw requests for seller
    this.router.get(
      '/seller',
      isAuthenticated,
      WithdrawValidator.getWithdrawsForSeller(),
      validateRequest,
      withdrawController.getWithdrawsForSeller
    )

    // Get withdraw requests for admin
    this.router.get(
      '/admin',
      isAuthenticated,
      WithdrawValidator.getWithdrawsForAdmin(),
      validateRequest,
      withdrawController.getWithdrawsForAdmin
    )

    // Get withdraw request details
    this.router.get(
      '/:withdrawId',
      isAuthenticated,
      WithdrawValidator.getWithdrawDetails(),
      validateRequest,
      withdrawController.getWithdrawDetails
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new WithdrawRouter().getRouter()
