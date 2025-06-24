import { WithdrawStatus } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { withdrawService } from './withdraw.services'

class WithdrawController {
  /**
   * Create a new withdraw request
   */
  async createWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { amount, walletName, walletPhoneNo } = req.body

      const withdraw = await withdrawService.createWithdraw({
        userId: userId!,
        amount,
        walletName,
        walletPhoneNo,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Withdraw request created successfully',
        success: true,
        data: withdraw,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cancel a withdraw request
   */
  async cancelWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { withdrawId } = req.params

      const withdraw = await withdrawService.cancelWithdraw({
        userId: userId!,
        withdrawId,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Withdraw request cancelled successfully',
        success: true,
        data: withdraw,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Approve a withdraw request (Admin)
   */
  async approveWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { withdrawId } = req.params
      const { systemWalletPhoneNo, transactionId } = req.body

      const withdraw = await withdrawService.approveWithdraw({
        adminId: adminId!,
        withdrawId,
        systemWalletPhoneNo,
        transactionId,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Withdraw request approved successfully',
        success: true,
        data: withdraw,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Reject a withdraw request (Admin)
   */
  async rejectWithdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { withdrawId } = req.params
      const { remarks } = req.body

      const withdraw = await withdrawService.rejectWithdraw({
        adminId: adminId!,
        withdrawId,
        remarks,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Withdraw request rejected successfully',
        success: true,
        data: withdraw,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get withdraw requests for seller
   */
  async getWithdrawsForSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user?.userId
      const { page, limit, search, status } = req.query

      // Convert status to array if it's a string
      let statusArray: WithdrawStatus[] | undefined
      if (typeof status === 'string') {
        statusArray = [status as WithdrawStatus]
      } else if (Array.isArray(status)) {
        statusArray = status as WithdrawStatus[]
      }

      const withdraws = await withdrawService.getWithdrawForSeller({
        sellerId: sellerId!,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        status: statusArray,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Withdraw requests retrieved successfully',
        success: true,
        data: withdraws,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get withdraw requests for admin
   */
  async getWithdrawsForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { page, limit, search, status } = req.query

      // Convert status to array if it's a string
      let statusArray: WithdrawStatus[] | undefined
      if (typeof status === 'string') {
        statusArray = [status as WithdrawStatus]
      } else if (Array.isArray(status)) {
        statusArray = status as WithdrawStatus[]
      }

      const withdraws = await withdrawService.getWithdrawForAdmin({
        adminId: adminId!,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        status: statusArray,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Withdraw requests retrieved successfully',
        success: true,
        data: withdraws,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get withdraw request details
   */
  async getWithdrawDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { withdrawId } = req.params

      const withdraw = await withdrawService.getWithdrawById(withdrawId)

      res.status(200).json({
        statusCode: 200,
        message: 'Withdraw request details retrieved successfully',
        success: true,
        data: withdraw,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new WithdrawController()
