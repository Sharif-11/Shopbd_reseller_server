import { NextFunction, Request, Response } from 'express'
import { transactionServices } from './transaction.services'

class TransactionController {
  /**
   * Get all transactions for a user
   */
  async getUserTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { page, limit, search } = req.query

      const transactions = await transactionServices.getAllTransactionsForUser({
        userId: userId!,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Transactions retrieved successfully',
        success: true,
        data: transactions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all transactions (admin only)
   */
  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req?.user?.userId
      const { page, limit, search } = req.query

      const transactions = await transactionServices.getAllTransactionsForAdmin(
        {
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          search: search as string,
          userId: userId!,
        },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'All transactions retrieved successfully',
        success: true,
        data: transactions,
      })
    } catch (error) {
      next(error)
    }
  }
  async updateBalanceByAdminToSeller(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const adminId = req?.user?.userId
      const { sellerId } = req.params
      const { amount, reason, transactionType } = req.body
      const transaction =
        await transactionServices.updateBalanceByAdminToSeller({
          requesterId: adminId!,
          sellerId,
          amount,
          reason,
          transactionType,
        })
      res.status(201).json({
        statusCode: 201,
        message: 'Balance Updated Successfully',
        success: true,
        data: transaction,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const transactionControllers = new TransactionController()
