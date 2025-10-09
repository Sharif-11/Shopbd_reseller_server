import { Router } from 'express'
import { isAuthenticated, verifyRole } from '../../middlewares/auth.middlewares'
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
      paymentControllers.verifyPaymentByAdmin,
    )
    this.router.post(
      '/admin/reject/:paymentId',
      isAuthenticated,
      // PaymentValidator.rejectPaymentByAdmin(),
      // validateRequest,
      paymentControllers.rejectPaymentByAdmin,
    )

    // Payment retrieval routes
    this.router.get(
      '/user/:userPhoneNo',
      isAuthenticated,
      PaymentValidator.getAllPaymentsOfAUser(),
      validateRequest,
      paymentControllers.getAllPaymentsOfAUser,
    )

    this.router.get(
      '/admin',
      isAuthenticated,
      PaymentValidator.getAllPaymentsForAdmin(),
      validateRequest,
      paymentControllers.getAllPaymentsForAdmin,
    )
    this.router.get(
      '/admin/:paymentId',
      isAuthenticated,
      PaymentValidator.getPaymentByIdForAdmin(),
      validateRequest,
      paymentControllers.getPaymentByIdForAdmin,
    )
    this.router.post(
      '/seller/pay-due',
      isAuthenticated,
      verifyRole('Seller'),
      PaymentValidator.payDueBySeller(),
      validateRequest,
      paymentControllers.createDuePayment,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new PaymentRouter().getRouter()
