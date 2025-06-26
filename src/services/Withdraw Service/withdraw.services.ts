import {
  BlockActionType,
  PermissionType,
  Prisma,
  WithdrawStatus,
} from '@prisma/client'

import Decimal from 'decimal.js'

import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import paymentService from '../Payment Service/payment.service'
import { blockServices } from '../UserManagement/Block Management/block.services'
import userServices from '../UserManagement/user.services'
import { transactionServices } from '../Utility Services/transaction.services'
import walletServices from '../WalletManagement/wallet.services'
import { calculateTransactionFee, WalletName } from './withdraw.utils'

class WithdrawService {
  public async getWithdrawById(withdrawId: string) {
    const withdraw = await prisma.withdraw.findUnique({
      where: { withdrawId },
    })
    if (!withdraw) {
      throw new Error('Withdraw request not found')
    }
    return withdraw
  }
  public async createWithdraw({
    userId,
    amount,
    walletName,
    walletPhoneNo,
  }: {
    userId: string
    amount: number
    walletName: string
    walletPhoneNo: string
  }) {
    const decimalAmount = new Decimal(amount)
    if (decimalAmount.isNegative() || decimalAmount.isZero()) {
      throw new Error('Amount must be greater than zero')
    }
    if (decimalAmount.greaterThan(config.maximumWithdrawAmount)) {
      throw new Error('Amount exceeds the maximum withdraw limit')
    }
    const user = await userServices.getUserByIdWithLock(userId)

    // check user block status
    const isBlocked = await blockServices.isUserBlocked(
      user.phoneNo,
      BlockActionType.WITHDRAW_REQUEST
    )
    if (isBlocked) {
      throw new Error(
        'You are blocked from making withdraw requests. Please contact support.'
      )
    }
    // check if user has sufficient balance
    if ((user.balance?.toNumber() || 0) < amount) {
      throw new Error('Insufficient balance for withdrawal')
    }
    const { actualAmount, transactionFee } = calculateTransactionFee({
      walletName: walletName as WalletName,
      walletPhoneNo,
      amount,
    })
    // create withdraw request
    // check wallet ownership
    await walletServices.checkWalletOwnership(
      user.userId,
      walletPhoneNo,
      walletName
    )
    // check if user has a pending withdraw request
    const existingWithdraw = await prisma.withdraw.findFirst({
      where: {
        userId,
        withdrawStatus: 'PENDING',
      },
    })
    if (existingWithdraw) {
      throw new ApiError(
        400,
        'You already have a pending withdraw request. Please wait for it to be processed.'
      )
    }
    // check if user  request two withdraws within 24 hours
    const lastWithdraw = await prisma.withdraw.findFirst({
      where: {
        userId,
        withdrawStatus: 'COMPLETED',
      },
      orderBy: { requestedAt: 'desc' },
    })
    const timeDifference = lastWithdraw
      ? new Date().getTime() - new Date(lastWithdraw.requestedAt).getTime()
      : null
    if (timeDifference && timeDifference < 24 * 60 * 60 * 1000) {
      throw new ApiError(
        400,
        'You can only request one withdraw every 24 hours. Please try again later.'
      )
    }

    const withdraw = await prisma.withdraw.create({
      data: {
        userId: user.userId,
        amount,
        walletName,
        walletPhoneNo,
        userName: user.name,
        userPhoneNo: user.phoneNo,
        transactionFee,
        actualAmount,
      },
    })
    return withdraw
  }
  public async cancelWithdraw({
    userId,
    withdrawId,
  }: {
    userId: string
    withdrawId: string
  }) {
    const withdraw = await this.getWithdrawById(withdrawId)
    if (withdraw.userId !== userId) {
      throw new ApiError(
        403,
        'You are not authorized to cancel this withdraw request'
      )
    }
    if (withdraw.withdrawStatus !== 'PENDING') {
      throw new ApiError(400, 'Only pending withdraw requests can be cancelled')
    }
    return await prisma.withdraw.delete({
      where: { withdrawId },
    })
  }
  public async approveWithdraw({
    adminId,
    withdrawId,
    systemWalletPhoneNo,
    transactionId,
  }: {
    adminId: string
    withdrawId: string
    systemWalletPhoneNo: string
    transactionId: string
  }) {
    // check permissions
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.WITHDRAWAL_MANAGEMENT,
      'APPROVE'
    )
    const withdraw = await this.getWithdrawById(withdrawId)
    await paymentService.checkExistingTransactionId(transactionId)
    // check if withdraw is already approved
    if (withdraw.withdrawStatus !== 'PENDING') {
      throw new ApiError(400, 'Only pending withdraw requests can be completed')
    }
    // check user balance
    const user = await userServices.getUserByIdWithLock(withdraw.userId)
    if ((user.balance?.toNumber() || 0) < withdraw.amount.toNumber()) {
      throw new ApiError(400, 'Insufficient balance for withdrawal')
    }
    const updatedWithdraw = await prisma.$transaction(async tx => {
      const payment = await paymentService.createWithdrawPayment({
        tx,
        userName: withdraw.userName,
        userPhoneNo: withdraw.userPhoneNo,
        amount: withdraw.amount.toNumber(),
        transactionFee: withdraw.transactionFee?.toNumber() || 0,
        systemWalletPhoneNo,
        systemWalletName: withdraw.walletName, // TODO: Get actual system wallet name
        transactionId,
        userWalletName: withdraw.walletName,
        userWalletPhoneNo: withdraw.walletPhoneNo,
      })
      // update withdraw status
      const updatedWithdraw = await tx.withdraw.update({
        where: { withdrawId },
        data: {
          withdrawStatus: 'COMPLETED',
          paymentId: payment.paymentId,
          processedAt: new Date(),
          transactionId,
          systemWalletPhoneNo,
        },
      })
      // deduct balance from user
      await transactionServices.createTransaction({
        tx,
        userId: withdraw.userId,
        amount: withdraw.amount.toNumber(),
        reason: 'ব্যালেন্স উত্তোলন',
        transactionType: 'Debit',
      })
      return updatedWithdraw
    })
    return updatedWithdraw

    // check if system wallet exists

    // TODO: Implement approval logic
  }
  public async rejectWithdraw({
    adminId,
    withdrawId,
    remarks,
  }: {
    adminId: string
    withdrawId: string
    remarks?: string
  }) {
    // check permissions
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.WITHDRAWAL_MANAGEMENT,
      'REJECT'
    )
    const withdraw = await this.getWithdrawById(withdrawId)
    // check if withdraw is already approved
    if (withdraw.withdrawStatus !== 'PENDING') {
      throw new ApiError(400, 'Only pending withdraw requests can be rejected')
    }
    const updatedWithdraw = await prisma.withdraw.update({
      where: { withdrawId },
      data: {
        withdrawStatus: 'REJECTED',
        remarks,
        processedAt: new Date(),
        transactionId: null, // No transaction ID for rejected withdraws
      },
    })

    return updatedWithdraw
  }
  // Method to get all withdraw requests with pagination and filtering
  public async getWithdrawForSeller({
    sellerId,
    page,
    limit,
    search,
    status,
  }: {
    sellerId: string
    page?: number
    limit?: number
    search?: string
    status?: WithdrawStatus[] | WithdrawStatus
  }) {
    const offset = (page || 1) - 1
    const take = limit || 10
    const where = {
      userId: sellerId,
      withdrawStatus: status
        ? Array.isArray(status)
          ? { in: status }
          : status
        : undefined,
      ...(search && {
        OR: [
          {
            userName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          {
            userPhoneNo: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            walletPhoneNo: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            walletName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            transactionId: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    }
    const withdraws = await prisma.withdraw.findMany({
      where,
      skip: offset * take,
      take,
      orderBy: { requestedAt: 'desc' },
    })
    const totalWithdraws = await prisma.withdraw.count({
      where,
    })
    return {
      withdraws,
      totalWithdraws,
      totalPages: Math.ceil(totalWithdraws / take),
      currentPage: page || 1,
      pageSize: take,
    }
  }
  // Method to get all withdraw requests for admin with pagination and filtering
  public async getWithdrawForAdmin({
    adminId,
    page,
    limit,
    search,
    status,
  }: {
    page?: number
    limit?: number
    search?: string
    status?: WithdrawStatus[] | WithdrawStatus
    adminId: string
  }) {
    // check permissions
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.WITHDRAWAL_MANAGEMENT,
      'READ'
    )
    const offset = (page || 1) - 1
    const take = limit || 10
    const where: Prisma.WithdrawWhereInput = {
      withdrawStatus: status
        ? Array.isArray(status)
          ? { in: status }
          : status
        : undefined,
      ...(search && {
        OR: [
          {
            userName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          {
            userPhoneNo: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            walletPhoneNo: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }),
    }
    const withdraws = await prisma.withdraw.findMany({
      where,
      skip: offset * take,
      take,
      orderBy: { processedAt: 'desc', requestedAt: 'desc' },
    })
    return withdraws
  }
}
export const withdrawService = new WithdrawService()
