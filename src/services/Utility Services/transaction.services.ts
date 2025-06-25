import { Prisma } from '@prisma/client'
import prisma from '../../utils/prisma'

class TransactionService {
  private async deductBalance({
    userId,
    amount,
    tx,
  }: {
    userId: string
    amount: number
    tx: Prisma.TransactionClient
  }) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero')
    }
    // Logic to deduct balance from user's account with row lock
    await tx.$executeRaw`SELECT * FROM "users" WHERE "userId" = ${userId} FOR UPDATE`

    await tx.$executeRaw`UPDATE "users" SET "balance" = "balance" - ${amount} WHERE "userId" = ${userId}`
  }
  private async addBalance({
    userId,
    amount,
    tx,
  }: {
    userId: string
    amount: number
    tx: Prisma.TransactionClient
  }) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero')
    }
    // Logic to add balance to user's account with row lock
    await tx.$executeRaw`SELECT * FROM "users" WHERE "userId" = ${userId} FOR UPDATE`

    await tx.$executeRaw`UPDATE "users" SET "balance" = "balance" + ${amount} WHERE "userId" = ${userId}`
  }
  public async createTransaction({
    tx,
    userId,
    userPhoneNo,
    amount,
    reason,
    reference,
    transactionType,
  }: {
    tx: Prisma.TransactionClient
    userId?: string
    userPhoneNo?: string
    amount: number
    reason: string
    transactionType: 'Credit' | 'Debit'
    reference?: Record<string, any>
  }) {
    // Here we need to ensure that either userId or userPhoneNo is provided
    if (!userId && !userPhoneNo) {
      throw new Error('Either userId or userPhoneNo must be provided')
    }
    let user = null
    if (userId) {
      user = await tx.user.findUnique({
        where: { userId },
        select: { userId: true, phoneNo: true, balance: true, name: true },
      })
    } else if (userPhoneNo) {
      user = await tx.user.findUnique({
        where: { phoneNo: userPhoneNo },
        select: { userId: true, phoneNo: true, balance: true, name: true },
      })
    }
    if (!user) {
      throw new Error('User not found')
    }
    if (transactionType === 'Debit') {
      await this.deductBalance({
        userId: user.userId,
        amount: Math.abs(amount),
        tx,
      })
    }
    if (transactionType === 'Credit') {
      await this.addBalance({
        userId: user.userId,
        amount,
        tx,
      })
    }
    // Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: user.userId,
        userPhoneNo: user.phoneNo,
        userName: user.name,
        amount: transactionType === 'Credit' ? amount : -amount,
        reason,
        reference,
      },
    })
    return transaction
  }
  // Additional methods for transaction retrieval, etc. can be added here
  public async getAllTransactionsForUser({
    userId,
    page,
    limit,
    search,
  }: {
    userId: string
    page?: number
    limit?: number
    search?: string
  }) {
    const offset = (page || 1) - 1
    const take = limit || 10
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(search && {
        OR: [
          { reason: { contains: search, mode: 'insensitive' } },
          { userName: { contains: search, mode: 'insensitive' } },
          { userPhoneNo: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }
    const transactions = await prisma.transaction.findMany({
      where,
      skip: offset * take,
      take,
      orderBy: { createdAt: 'desc' },
    })
    return transactions
  }
  public async getAllTransactionsForAdmin({
    page,
    limit,
    search,
  }: {
    page?: number
    limit?: number
    search?: string
  }) {
    const offset = (page || 1) - 1
    const take = limit || 10
    const where: Prisma.TransactionWhereInput = {
      ...(search && {
        OR: [
          { reason: { contains: search, mode: 'insensitive' } },
          { userName: { contains: search, mode: 'insensitive' } },
          { userPhoneNo: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }
    const transactions = await prisma.transaction.findMany({
      where,
      skip: offset * take,
      take,
      orderBy: { createdAt: 'desc' },
    })
    return transactions
  }
}
export const transactionServices = new TransactionService()
