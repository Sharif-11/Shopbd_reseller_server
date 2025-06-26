import { Router } from 'express'
import { isAuthenticated } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import paymentControllers from './payment.controller'
import PaymentValidator from './payment.validator'

class PaymentRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Payment creation routes

    // Admin payment management routes
    this.router.post(
      '/admin/verify/:paymentId',
      isAuthenticated,
      PaymentValidator.verifyPaymentByAdmin(),
      validateRequest,
      paymentControllers.verifyPaymentByAdmin
    )

    // Payment retrieval routes
    this.router.get(
      '/user/:userPhoneNo',
      isAuthenticated,
      PaymentValidator.getAllPaymentsOfAUser(),
      validateRequest,
      paymentControllers.getAllPaymentsOfAUser
    )

    this.router.get(
      '/admin',
      isAuthenticated,
      PaymentValidator.getAllPaymentsForAdmin(),
      validateRequest,
      paymentControllers.getAllPaymentsForAdmin
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new PaymentRouter().getRouter()
