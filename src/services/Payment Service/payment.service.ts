import {
  BlockActionType,
  PaymentStatus,
  PaymentType,
  PermissionType,
  Prisma,
  SenderType,
} from '@prisma/client'
import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import { orderService } from '../Order Services/order.service'
import { blockServices } from '../UserManagement/Block Management/block.services'
import userServices from '../UserManagement/user.services'
import { transactionServices } from '../Utility Services/Transaction Services/transaction.services'
import walletServices from '../WalletManagement/wallet.services'

class PaymentService {
  public async checkExistingTransactionId(
    transactionId: string,
    tx: Prisma.TransactionClient | undefined = undefined,
  ) {
    const existingTransaction = await (tx || prisma).payment.findUnique({
      where: { transactionId },
    })
    if (existingTransaction) {
      throw new Error('Transaction ID already exists')
    }
    return existingTransaction
  }
  public async createDuePayment({
    userId,
    walletName,
    walletPhoneNo,
    amount,
    transactionId,
    systemWalletPhoneNo,
  }: {
    userId: string
    walletName: string
    walletPhoneNo: string
    amount: number
    transactionId: string
    systemWalletPhoneNo: string
  }) {
    // check user is blocked
    const isBlocked = await blockServices.isUserBlocked(
      walletPhoneNo,
      BlockActionType.PAYMENT_REQUEST,
    )
    if (isBlocked) {
      throw new ApiError(
        400,
        'You are blocked from payment request. Please contact support',
      )
    }
    await this.checkExistingTransactionId(transactionId)
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    const systemWallet = await walletServices.checkSystemWalletOwnership({
      systemWalletPhoneNo,
      systemWalletName: walletName,
    })
    const payment = await prisma.payment.create({
      data: {
        userName: user.name,
        userPhoneNo: walletPhoneNo,
        amount,
        transactionId,
        systemWalletPhoneNo,
        paymentType: 'DUE_PAYMENT',
        paymentStatus: 'PENDING',
        userWalletName: walletName,
        userWalletPhoneNo: walletPhoneNo,
        sender: 'SELLER',
      },
    })
    return payment
  }
  public async createWithdrawPayment({
    userName,
    userPhoneNo,
    amount,
    transactionFee,
    systemWalletPhoneNo,
    systemWalletName,
    transactionId,
    userWalletName,
    userWalletPhoneNo,
    tx,
  }: {
    userName: string
    userPhoneNo: string
    amount: number
    transactionFee: number
    systemWalletPhoneNo: string
    systemWalletName: string
    transactionId: string
    userWalletName: string
    userWalletPhoneNo: string
    tx?: Prisma.TransactionClient
  }) {
    await this.checkExistingTransactionId(transactionId, tx)
    const payment = await (tx || prisma).payment.create({
      data: {
        userName,
        userPhoneNo,
        amount,
        transactionFee,
        systemWalletPhoneNo,
        systemWalletName,
        transactionId,
        paymentType: 'WITHDRAWAL_PAYMENT',
        paymentStatus: 'COMPLETED',
        processedAt: new Date(),
        actualAmount: amount - transactionFee,
        sender: 'SYSTEM',
        userWalletName,
        userWalletPhoneNo,
      },
    })
    return payment
  }
  public async createPayment({
    tx,
    paymentType,
    sender,
    userWalletName,
    userWalletPhoneNo,
    systemWalletPhoneNo,
    amount,
    transactionId,
    userName,
    userPhoneNo,
  }: {
    tx?: Prisma.TransactionClient
    paymentType: PaymentType
    sender: SenderType
    userWalletName: string
    userWalletPhoneNo: string
    systemWalletPhoneNo: string
    amount: number
    transactionId: string
    userName: string
    userPhoneNo: string
  }) {
    const isBlocked = await blockServices.isUserBlocked(
      userPhoneNo,
      BlockActionType.PAYMENT_REQUEST,
    )
    if (isBlocked) {
      throw new ApiError(
        400,
        'You are blocked from payment request. Please contact support',
      )
    }
    await this.checkExistingTransactionId(transactionId, tx)
    const payment = await (tx || prisma).payment.create({
      data: {
        paymentType,
        sender,
        userWalletName,
        userWalletPhoneNo,
        systemWalletPhoneNo,
        amount,
        transactionId,
        userName,
        userPhoneNo,
        paymentStatus:
          paymentType === 'CUSTOMER_REFUND' ? 'COMPLETED' : 'PENDING',
      },
    })
    return payment
  }
  public async verifyPaymentByAdmin({
    adminId,
    paymentId,
    transactionId,
  }: {
    adminId: string
    paymentId: string
    transactionId: string
  }) {
    // verify permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.PAYMENT_MANAGEMENT,
      'APPROVE',
    )
    console.log({ paymentId, transactionId })
    // check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
    })
    if (!payment) {
      throw new Error('Payment not found')
    }
    // check if transactionId matches
    if (payment.transactionId !== transactionId) {
      throw new Error('Transaction ID does not match')
    }
    let updatedPayment = null
    // update payment status
    if (payment.paymentType === 'DUE_PAYMENT') {
      updatedPayment = await prisma.$transaction(async tx => {
        // update payment status and create a transaction
        const result = await tx.payment.update({
          where: { paymentId },
          data: {
            paymentStatus: 'COMPLETED',
            processedAt: new Date(),
          },
        })
        // create a transaction
        await transactionServices.createTransaction({
          tx,
          amount: payment.amount.toNumber(),
          userPhoneNo: payment.userPhoneNo,
          reason: 'বকেয়া পরিশোধ',
          transactionType: 'Credit',
        })
      })
      return updatedPayment
    } else if (payment.paymentType === 'ORDER_PAYMENT') {
      const updatedPayment = await prisma.$transaction(async tx => {
        const order = await tx.order.findFirst({
          where: { Payment: { paymentId } },
        })
        if (!order) {
          throw new Error('Order not found for this payment')
        }
        // update payment status
        const updatedPayment = await tx.payment.update({
          where: { paymentId },
          data: {
            paymentStatus: 'COMPLETED',
            processedAt: new Date(),
          },
        })
        // update order status
        await orderService.confirmOrderByAdmin({
          tx,
          orderId: order.orderId,
        })
      })
    } else {
      updatedPayment = await prisma.payment.update({
        where: { paymentId },
        data: {
          paymentStatus: 'COMPLETED',
          processedAt: new Date(),
        },
      })
      // check if there any order associated with this payment
    }
    return updatedPayment
  }
  public async rejectPaymentByAdmin({
    adminId,
    paymentId,
    remarks,
  }: {
    adminId: string
    paymentId: string
    remarks: string
  }) {
    // verify permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.PAYMENT_MANAGEMENT,
      'REJECT',
    )
    // check user is blocked

    // check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
    })
    if (!payment) {
      throw new Error('Payment not found')
    }
    // count total rejected payments for the user
    const totalRejectedPayments = await prisma.payment.count({
      where: {
        userPhoneNo: payment.userPhoneNo,
        paymentStatus: 'REJECTED',
      },
    })
    console.log({ totalRejectedPayments })
    if (totalRejectedPayments >= config.maxRejectedPaymentLimit) {
      // block user if they have 3 or more rejected payments
      await prisma.$transaction(async tx => {
        if (payment.paymentType === 'ORDER_PAYMENT') {
          const order = await orderService.rejectOrderByAdmin({
            tx,
            orderId: payment.orderId!,
          })
          if (order.orderStatus !== 'REJECTED') {
            return
          }
        }
        // delete all those rejected payments
        await tx.payment.deleteMany({
          where: {
            userPhoneNo: payment.userPhoneNo,
            paymentStatus: 'REJECTED',
          },
        })

        // block user
        await blockServices.createBlockRecordBySystem({
          actions: [
            {
              actionType: BlockActionType.PAYMENT_REQUEST,
              active: true,
              reason: 'Too many rejected payments',
              expiresAt: null, // no expiration for this block
            },
          ],
          userPhoneNo: payment.userPhoneNo,
          tx,
        })
      })
      return null
    } else {
      if (payment.paymentType === 'ORDER_PAYMENT') {
        return await prisma.$transaction(async tx => {
          await orderService.rejectOrderByAdmin({
            tx,
            orderId: payment.orderId!,
          })
          return await tx.payment.update({
            where: { paymentId },
            data: {
              paymentStatus: 'REJECTED',
              remarks,
              processedAt: new Date(),
              transactionId: null, // clear transactionId on rejection
            },
          })
        })
      } else {
        return await prisma.payment.update({
          where: { paymentId },
          data: {
            paymentStatus: 'REJECTED',
            remarks,
            processedAt: new Date(),
            transactionId: null, // clear transactionId on rejection
          },
        })
      }
    }
  }
  public async getAllPaymentsOfAUser({
    userPhoneNo,
    paymentStatus,
    page,
    limit,
    search,
  }: {
    userPhoneNo: string
    paymentStatus?: PaymentStatus | PaymentStatus[]
    page?: number
    limit?: number
    search?: string
  }) {
    const where: Prisma.PaymentWhereInput = {
      userPhoneNo,
      paymentStatus: paymentStatus
        ? Array.isArray(paymentStatus)
          ? { in: paymentStatus }
          : paymentStatus
        : undefined,
    }
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
        {
          userWalletName: { contains: search, mode: 'insensitive' },
        },
        {
          userWalletPhoneNo: { contains: search, mode: 'insensitive' },
        },
      ]
    }
    const skip = (Number(page || 0) - 1) * (limit || 10)
    const payments = await prisma.payment.findMany({
      where,
      skip,
      take: limit || 10,
      orderBy: { paymentDate: 'desc' },
    })
    const totalCount = await prisma.payment.count({ where })
    return {
      payments,
      totalCount,
      totalPages: Math.ceil(totalCount / (limit || 10)),
      currentPage: page || 1,
    }
  }
  public async getAllPaymentsForAdmin({
    adminId,
    paymentStatus,
    search,
    transactionId,
    page,
    limit,
  }: {
    adminId: string
    paymentStatus?: PaymentStatus | PaymentStatus[]
    search?: string
    transactionId?: string
    page?: number
    limit?: number
  }) {
    // verify permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.PAYMENT_MANAGEMENT,
      'READ',
    )

    const where: Prisma.PaymentWhereInput = {
      paymentStatus: paymentStatus
        ? Array.isArray(paymentStatus)
          ? { in: paymentStatus }
          : paymentStatus
        : undefined,
      transactionId: transactionId
        ? { contains: transactionId, mode: 'insensitive' }
        : undefined,
      OR: search
        ? [
            { userWalletName: { contains: search, mode: 'insensitive' } },
            { userWalletPhoneNo: { contains: search, mode: 'insensitive' } },
            { userName: { contains: search, mode: 'insensitive' } },
            { userPhoneNo: { contains: search, mode: 'insensitive' } },
            { systemWalletPhoneNo: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    }
    const skip = (Number(page || 1) - 1) * (limit || 10)
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit || 10,
    })
    const totalCount = await prisma.payment.count({ where })
    return {
      payments,
      totalCount,
      totalPages: Math.ceil(totalCount / (limit || 10)),
      currentPage: page || 1,
    }
  }
}

export default new PaymentService()
