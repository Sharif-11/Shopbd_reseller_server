import { Prisma } from '@prisma/client'
import prisma from '../../utils/prisma'

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
}
export default new PaymentService()
