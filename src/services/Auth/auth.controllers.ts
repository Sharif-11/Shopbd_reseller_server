import { NextFunction, Request, Response } from 'express'
import otpServices from '../Utility Services/otp.services'

class AuthController {
  /**
   * Send OTP to a phone number
   */
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo } = req.body
      const data = await otpServices.sendOtp(phoneNo)

      res.status(200).json({
        statusCode: 200,
        message: data.isVerified
          ? 'এই নম্বরটি ইতিমধ্যে যাচাই করা হয়েছে'
          : data.sendOTP
          ? 'OTP সফলভাবে পাঠানো হয়েছে'
          : data.message || 'OTP request processed',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Verify OTP for phone number verification
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo, otp } = req.body
      const data = await otpServices.verifyOtp(phoneNo, otp)

      res.status(200).json({
        statusCode: 200,
        message: data.alreadyVerified
          ? 'এই নম্বরটি ইতিমধ্যে যাচাই করা হয়েছে'
          : 'OTP সফলভাবে যাচাই করা হয়েছে',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Check if a phone number is verified
   */
  async checkVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo } = req.body
      const data = await otpServices.isVerified(phoneNo)

      res.status(200).json({
        statusCode: 200,
        message: data.isVerified
          ? 'এই নম্বরটি যাচাই করা হয়েছে'
          : 'এই নম্বরটি যাচাই করা হয়নি',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Unblock a phone number
   */
  async unblockContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo } = req.body
      const data = await otpServices.unblockContact(phoneNo)

      res.status(200).json({
        statusCode: 200,
        message: data.isUnblocked
          ? 'ফোন নম্বরটি আনব্লক করা হয়েছে'
          : data.message || 'Unblock request processed',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new AuthController()
