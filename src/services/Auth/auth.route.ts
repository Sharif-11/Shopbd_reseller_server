// routes/auth.route.ts
import { Router } from 'express'
import validateRequest from '../../middlewares/validation.middleware'
import authControllers from './auth.controllers'
import AuthValidator from './auth.validator'

class AuthRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Route to send OTP
    this.router.post(
      '/send-otp',
      AuthValidator.sendOtp(), // Using the imported validator
      validateRequest,
      authControllers.sendOtp // Using the imported controller
    )

    // Route to verify OTP
    this.router.post(
      '/verify-otp',
      AuthValidator.verifyOtp(),
      validateRequest,
      authControllers.verifyOtp
    )
    // Route to check verification status
    this.router.get(
      '/check-verification',
      AuthValidator.checkVerification(),
      validateRequest,
      authControllers.checkVerification
    )
    // Route to unblock a contact
    this.router.patch(
      '/unblock-contact',
      AuthValidator.unblockContact(),
      validateRequest,
      authControllers.unblockContact
    )

    // Add more auth routes as needed
    // this.router.post('/refresh-token', refreshToken);
    // this.router.post('/logout', logout);
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new AuthRouter().getRouter()
