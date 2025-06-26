import { NextFunction, Request, Response } from 'express'

import { PaymentStatus } from '@prisma/client'
import paymentServices from './payment.service'

class PaymentController {
  /**
   * Create a payment
   */
  // async createPayment(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const {
  //       paymentType,
  //       sender,
  //       userWalletName,
  //       userWalletPhoneNo,
  //       systemWalletPhoneNo,
  //       amount,
  //       transactionId,
  //     } = req.body

  //     const userPhoneNo = req.user?.phoneNo
  //     const userName = req.user?.name

  //     if (!userPhoneNo || !userName) {
  //       throw new Error('User information not found in request')
  //     }

  //     const payment = await paymentServices.createPayment({
  //       paymentType,
  //       sender,
  //       userWalletName,
  //       userWalletPhoneNo,
  //       systemWalletPhoneNo,
  //       amount,
  //       transactionId,
  //       userName,
  //       userPhoneNo,
  //     })

  //     res.status(201).json({
  //       statusCode: 201,
  //       message: 'Payment created successfully',
  //       success: true,
  //       data: payment,
  //     })
  //   } catch (error) {
  //     next(error)
  //   }
  // }

  /**
   * Create a withdrawal payment
   */
  // async createWithdrawPayment(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const {
  //       amount,
  //       transactionFee,
  //       systemWalletPhoneNo,
  //       systemWalletName,
  //       transactionId,
  //       userWalletName,
  //       userWalletPhoneNo,
  //     } = req.body

  //     const userPhoneNo = req.user?.phoneNo
  //     const userName = req.user?.name

  //     if (!userPhoneNo || !userName) {
  //       throw new Error('User information not found in request')
  //     }

  //     const payment = await paymentServices.createWithdrawPayment({
  //       userName,
  //       userPhoneNo,
  //       amount,
  //       transactionFee,
  //       systemWalletPhoneNo,
  //       systemWalletName,
  //       transactionId,
  //       userWalletName,
  //       userWalletPhoneNo,
  //     })

  //     res.status(201).json({
  //       statusCode: 201,
  //       message: 'Withdrawal payment created successfully',
  //       success: true,
  //       data: payment,
  //     })
  //   } catch (error) {
  //     next(error)
  //   }
  // }

  /**
   * Verify a payment by admin
   */
  async verifyPaymentByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { paymentId } = req.params
      const { transactionId } = req.body

      const payment = await paymentServices.verifyPaymentByAdmin({
        adminId: adminId!,
        paymentId,
        transactionId,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Payment verified successfully',
        success: true,
        data: payment,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Reject a payment by admin
   */
  async rejectPaymentByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { paymentId } = req.params
      const { remarks } = req.body
      const userPhoneNo = req.user?.phoneNo

      if (!userPhoneNo) {
        throw new Error('User phone number not found in request')
      }

      const payment = await paymentServices.rejectPaymentByAdmin({
        adminId: adminId!,
        paymentId,
        remarks,
        userPhoneNo,
      })

      if (!payment) {
        return res.status(200).json({
          statusCode: 200,
          message: 'User blocked due to too many rejected payments',
          success: true,
          data: null,
        })
      }

      res.status(200).json({
        statusCode: 200,
        message: 'Payment rejected successfully',
        success: true,
        data: payment,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all payments of a user
   */
  async getAllPaymentsOfAUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userPhoneNo } = req.params
      const { paymentStatus, page, limit, search } = req.query

      const result = await paymentServices.getAllPaymentsOfAUser({
        userPhoneNo,
        paymentStatus: paymentStatus as PaymentStatus | PaymentStatus[],
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Payments retrieved successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all payments for admin
   */
  async getAllPaymentsForAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const adminId = req.user?.userId
      const { paymentStatus, search, transactionId, page, limit } = req.query

      const result = await paymentServices.getAllPaymentsForAdmin({
        adminId: adminId!,
        paymentStatus: paymentStatus as PaymentStatus | PaymentStatus[],
        search: search as string,
        transactionId: transactionId as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Payments retrieved successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new PaymentController()
