import { NextFunction, Request, Response } from 'express'
import commissionService from './commission.services'

class CommissionController {
  /**
   * Replace the entire commission table with new data
   */
  async replaceCommissionTable(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req.user?.userId // Assuming userId is available in req.user
      const { commissions } = req.body
      const data = await commissionService.replaceCommissionTable(
        adminId!,
        commissions,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'কমিশন টেবিল সফলভাবে আপডেট করা হয়েছে',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get the current commission table
   */
  async getCommissionTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await commissionService.getCommissionTable()

      res.status(200).json({
        statusCode: 200,
        message: 'কমিশন টেবিল সফলভাবে পাওয়া গেছে',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Calculate commissions for a specific price and user
   */
  async calculateCommissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userPhone, price } = req.body
      const data = await commissionService.calculateUserCommissions(
        userPhone,
        price,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'কমিশন সফলভাবে গণনা করা হয়েছে',
        success: true,
        data,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new CommissionController()
