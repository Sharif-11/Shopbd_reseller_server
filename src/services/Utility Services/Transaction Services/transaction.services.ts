import { ActionType, PermissionType, Prisma } from '@prisma/client'
import prisma from '../../../utils/prisma'
import userServices from '../../UserManagement/user.services'

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
  private async deductBalanceFromCustomer({
    customerId,
    amount,
    tx,
  }: {
    customerId: string
    amount: number
    tx: Prisma.TransactionClient
  }) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero')
    }
    // Logic to deduct balance from customer's account with row lock
    await tx.$executeRaw`SELECT * FROM "customers" WHERE "customerId" = ${customerId} FOR UPDATE`

    await tx.$executeRaw`UPDATE "customers" SET "balance" = "balance" - ${amount} WHERE "customerId" = ${customerId}`
  }
  private async addBalanceToCustomer({
    customerId,
    amount,
    tx,
  }: {
    customerId: string
    amount: number
    tx: Prisma.TransactionClient
  }) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero')
    }
    // Logic to add balance to customer's account with row lock
    await tx.$executeRaw`SELECT * FROM "customers" WHERE "customerId" = ${customerId} FOR UPDATE`

    await tx.$executeRaw`UPDATE "customers" SET "balance" = "balance" + ${amount} WHERE "customerId" = ${customerId}`
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
  public async createTransactionForCustomer({
    tx,
    customerId,
    amount,
    reason,
    transactionType,
  }: {
    tx: Prisma.TransactionClient
    customerId: string
    amount: number
    reason: string
    transactionType: 'Credit' | 'Debit'
  }) {
    // Ensure that the customer exists
    const customer = await tx.customer.findUnique({
      where: { customerId },
      select: {
        customerId: true,
        customerPhoneNo: true,
        balance: true,
        customerName: true,
      },
    })
    if (!customer) {
      throw new Error('Customer not found')
    }
    console.log(customer)
    if (transactionType === 'Debit') {
      await this.deductBalanceFromCustomer({
        customerId: customer.customerId,
        amount: Math.abs(amount),
        tx,
      })
    }
    if (transactionType === 'Credit') {
      await this.addBalanceToCustomer({
        customerId: customer.customerId,
        amount,
        tx,
      })
    }
    // Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: customer.customerId,
        userPhoneNo: customer.customerPhoneNo,
        userName: 'Customer',
        amount: transactionType === 'Credit' ? amount : -amount,
        reason,
        reference: {},
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
        OR: [{ reason: { contains: search, mode: 'insensitive' } }],
      }),
    }
    const transactions = await prisma.transaction.findMany({
      where,
      skip: offset * take,
      take,
      orderBy: { createdAt: 'desc' },
    })
    const totalCount = await prisma.transaction.count({ where })
    // count total credit and debit amount and calculate balance
    const totalCredit = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        amount: { gt: 0 },
      },
    })
    const totalDebit = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        amount: { lt: 0 },
      },
    })
    const balance =
      (totalCredit._sum.amount?.toNumber() || 0) +
      (totalDebit._sum.amount?.toNumber() || 0)
    return {
      transactions,
      totalCount,
      currentPage: offset + 1,
      pageSize: take,
      balance,
      totalCredit: totalCredit._sum.amount?.toNumber() || 0,
      totalDebit: totalDebit._sum.amount?.toNumber() || 0,
    }
  }
  public async getAllTransactionsForAdmin({
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
    // check permissions for admin
    await userServices.verifyUserPermission(
      userId,
      PermissionType.ALL,
      ActionType.READ
    )
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
      // please reverse the amount sign for admin transactions
    })

    const totalCount = await prisma.transaction.count({ where })
    // calculate total credit and debit amount and calculate balance, here the credit of user is the debit of the admin and vice versa

    return {
      transactions,
      totalCount,
      currentPage: offset + 1,
      pageSize: take,
    }
  }
}
export const transactionServices = new TransactionService()
