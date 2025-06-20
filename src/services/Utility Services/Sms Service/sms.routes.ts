import { Router } from 'express'
import { isAuthenticated } from '../../../middlewares/auth.middlewares'
import validateRequest from '../../../middlewares/validation.middleware'
import smsControllers from './sms.controller'
import SmsValidator from './sms.validator'

class SmsRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Basic SMS sending routes
    this.router.post(
      '/send',

      smsControllers.sendSms
    )

    // OTP related routes
    this.router.post(
      '/send-otp',

      smsControllers.sendOtp
    )

    // Password related routes
    this.router.post(
      '/send-password',

      SmsValidator.sendPassword(),
      validateRequest,
      smsControllers.sendPassword
    )

    // Order notification routes
    this.router.post(
      '/order-notification',

      SmsValidator.orderNotification(),
      validateRequest,
      smsControllers.sendOrderNotification
    )

    // Withdrawal request notification
    this.router.post(
      '/withdrawal-notification',
      isAuthenticated,
      SmsValidator.withdrawalNotification(),
      validateRequest,
      smsControllers.sendWithdrawalNotification
    )

    // Order status updates
    this.router.post(
      '/order-status',
      isAuthenticated,
      SmsValidator.orderStatus(),
      validateRequest,
      smsControllers.sendOrderStatus
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new SmsRouter().getRouter()
