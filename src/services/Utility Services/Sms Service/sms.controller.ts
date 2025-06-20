import { NextFunction, Request, Response } from 'express'
import SmsServices from './sms.services'

class SmsController {
  /**
   * Send generic SMS
   */
  async sendSms(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, message } = req.body
      const result = await SmsServices.sendSingleSms(recipients, message)

      res.status(200).json({
        statusCode: 200,
        message: 'SMS sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, otp } = req.body
      const result = await SmsServices.sendSingleSms(recipients, otp)

      res.status(200).json({
        statusCode: 200,
        message: 'OTP sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Send password via SMS
   */
  async sendPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, password } = req.body
      const result = await SmsServices.sendPassword(recipients, password)

      res.status(200).json({
        statusCode: 200,
        message: 'Password sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Send order notification to admin(s)
   */
  async sendOrderNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, orderId } = req.body
      const result = await SmsServices.sendOrderNotificationToAdmin({
        mobileNo: recipients,
        orderId,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order notification sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Notify admin about seller's balance withdrawal request
   */
  async sendWithdrawalNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { recipients, sellerName, sellerPhoneNo, amount } = req.body
      const result = await SmsServices.sendWithdrawalRequestToAdmin({
        mobileNo: recipients,
        sellerName,
        sellerPhoneNo,
        amount,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Withdrawal notification sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Send order status updates
   */
  async sendOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients, orderId, status, trackingUrl } = req.body
      const result = await SmsServices.notifyCustomer({
        customerPhoneNo: recipients,
        orderId,
        status,
        trackingUrl,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order status notification sent successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new SmsController()
