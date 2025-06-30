import {
  ActionType,
  BlockActionType,
  OrderStatus,
  PaymentMethod,
  PermissionType,
  Prisma,
} from '@prisma/client'
import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import paymentService from '../Payment Service/payment.service'
import productServices from '../ProductManagement/product.services'
import shopCategoryServices from '../ProductManagement/shopCategory.services'
import { blockServices } from '../UserManagement/Block Management/block.services'
import userServices from '../UserManagement/user.services'

import commissionServices from '../Commission Management/commission.services'
import SmsServices from '../Utility Services/Sms Service/sms.services'
import { transactionServices } from '../Utility Services/Transaction Services/transaction.services'
import walletServices from '../WalletManagement/wallet.services'
import { OrderData } from './order.types'

class OrderService {
  private async checkExistingTrackingUrl(trackingUrl?: string) {
    const existingOrder = await prisma.order.findFirst({
      where: { trackingUrl },
    })
    if (existingOrder) {
      throw new ApiError(400, 'Tracking URL already exists for another order')
    }
  }
  private async calculateDeliveryCharge({
    shopId,
    customerZilla,
    productQuantity,
  }: {
    shopId: number
    customerZilla: string
    productQuantity: number
  }) {
    const shop = await shopCategoryServices.getShop(shopId)
    const basicDeliveryCharge =
      customerZilla.toLowerCase() === shop.shopLocation.toLowerCase()
        ? shop.deliveryChargeInside
        : shop.deliveryChargeOutside
    if (productQuantity <= 3) {
      return basicDeliveryCharge
    } else {
      const additionalCharge =
        (productQuantity - 3) * config.extraDeliveryCharge
      return basicDeliveryCharge.add(additionalCharge)
    }
  }
  private async getOrderSmsRecipients() {
    const orderSmsRecipients = await userServices.getUsersWithPermission(
      PermissionType.ORDER_MANAGEMENT,
    )
    if (orderSmsRecipients.length === 0) {
      throw new ApiError(404, 'No users found with order management permission')
    }
    const phoneNumbers = orderSmsRecipients.map(user => user.phoneNo)
    if (phoneNumbers.length === 0) {
      throw new ApiError(404, 'No phone numbers found for order SMS recipients')
    }
    return phoneNumbers
  }
  public async createSellerOrder(
    userId: string,
    {
      shopId,
      customerName,
      customerPhoneNo,
      customerZilla,
      customerUpazilla,
      deliveryAddress,
      comments,
      products,
    }: OrderData,
  ) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    const {
      name: sellerId,
      balance: sellerBalance,
      isVerified: sellerVerified,
      shopName: sellerShopName,
      phoneNo: sellerPhoneNo,
      name: sellerName,
    } = user
    // check user blocked
    const isBlocked = await blockServices.isUserBlocked(
      sellerPhoneNo,
      BlockActionType.ORDER_REQUEST,
    )
    if (isBlocked) {
      throw new Error('You are blocked from placing orders')
    }
    // check shop data
    const shop = await shopCategoryServices.checkShopStatus(shopId)
    if (!shop || !shop.isActive) {
      throw new ApiError(400, 'Shop is not active')
    }
    const { shopName, shopLocation } = shop
    // verify products
    const verifiedOrderData =
      await productServices.verifyOrderProducts(products)
    console.clear()
    console.log('verifiedOrderData', verifiedOrderData)
    const deliveryCharge = await this.calculateDeliveryCharge({
      shopId,
      customerZilla,
      productQuantity: verifiedOrderData.totalProductQuantity,
    })
    const order = await prisma.order.create({
      data: {
        shopId,
        shopName,
        shopLocation,
        customerName,
        customerPhoneNo,
        customerZilla,
        customerUpazilla,
        customerAddress: deliveryAddress,
        customerComments: comments,
        OrderProduct: {
          create: verifiedOrderData.products.map(product => ({
            productId: product.productId,
            productImage: product.productImage,
            productQuantity: product.productQuantity,
            productSellingPrice: product.productSellingPrice,
            productVariant: product.productVariant,
            productBasePrice: product.productBasePrice,
            productName: product.productName,
            totalProductBasePrice: product.totalProductBasePrice,
            totalProductSellingPrice: product.totalProductSellingPrice,
            totalProductQuantity: product.totalProductQuantity,
          })),
        },
        deliveryCharge,
        sellerId: userId,
        sellerName,
        sellerPhoneNo,
        sellerVerified,
        sellerShopName,
        sellerBalance,
        orderStatus: 'UNPAID',
        orderType: 'SELLER_ORDER',

        totalCommission: verifiedOrderData.totalCommission,
        actualCommission: verifiedOrderData.totalCommission,
        totalProductBasePrice: verifiedOrderData.totalProductBasePrice,
        totalProductSellingPrice: verifiedOrderData.totalProductSellingPrice,
        totalProductQuantity: verifiedOrderData.totalProductQuantity,
      },
    })

    return order
  }
  public async getSellerOrders({
    userId,
    orderStatus,
    page,
    limit,
    search,
  }: {
    userId: string
    orderStatus?: OrderStatus | OrderStatus[]
    page?: number
    limit?: number
    search?: string
  }) {
    console.log({ orderStatus, page, limit, search })
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const where: any = {
      sellerId: user.userId,
      orderType: 'SELLER_ORDER',
    }
    if (orderStatus) {
      where.orderStatus = Array.isArray(orderStatus)
        ? { in: orderStatus }
        : orderStatus
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhoneNo: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = ((page || 1) - 1) * (limit || 10)

    const orders = await prisma.order
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit || 10,
        include: {
          OrderProduct: true,
          Payment: true,
        },
      })
      .then(orders =>
        orders.map(order => ({
          ...order,
          OrderProduct: order.OrderProduct.map(product => ({
            ...product,
            productVariant: JSON.parse(product.productVariant as string),
          })),
        })),
      )
    const totalOrders = await prisma.order.count({
      where,
    })
    return {
      orders,
      totalOrders,
      currentPage: page || 1,
      totalPages: Math.ceil(totalOrders / (limit || 10)),
      pageSize: limit || 10,
    }
  }
  public async orderPaymentBySeller({
    userId,
    orderId,
    paymentMethod,
    sellerWalletName,
    sellerWalletPhoneNo,
    systemWalletPhoneNo,
    amount,
    transactionId,
  }: {
    userId: string
    orderId: number
    paymentMethod: PaymentMethod
    sellerWalletName?: string
    sellerWalletPhoneNo?: string
    systemWalletPhoneNo?: string
    amount?: number
    transactionId?: string
  }) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }
    const order = await prisma.order.findUnique({
      where: { orderId, sellerId: userId },
      include: { OrderProduct: true },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus !== 'UNPAID') {
      throw new ApiError(400, 'Only unpaid orders can be paid')
    }
    if (order.cancelled) {
      throw new ApiError(400, 'Order already cancelled by you')
    }

    const { balance: sellerBalance, isVerified: sellerVerified } = user
    if (
      paymentMethod === 'BALANCE' &&
      user.balance!.toNumber() < order.deliveryCharge.toNumber()
    ) {
      throw new ApiError(
        400,
        'Insufficient balance in your wallet to pay for the order',
      )
    } else if (paymentMethod === 'BALANCE') {
      const updatedOrder = await prisma.$transaction(async tx => {
        const updatedOrder = await tx.order.update({
          where: { orderId },
          data: {
            orderStatus: 'CONFIRMED',
            paymentType: paymentMethod,
            isDeliveryChargePaid: true,
            deliveryChargePaidAt: new Date(),
            paymentVerified: true,
            cashOnAmount: order.totalProductSellingPrice,
          },
        })
        // update seller balance
        await transactionServices.createTransaction({
          tx,
          userId,
          transactionType: 'Debit',
          amount: order.deliveryCharge.toNumber(),
          reason: 'ডেলিভারি চার্জ কর্তন',
        })
        return updatedOrder
      })
      return updatedOrder
    } else {
      if (
        !systemWalletPhoneNo ||
        !sellerWalletName ||
        !sellerWalletPhoneNo ||
        !amount ||
        !transactionId
      ) {
        throw new ApiError(400, 'Missing required fields')
      }
      const systemWallet = await walletServices.verifySystemWalletOwnership({
        systemWalletName: sellerWalletName!,
        systemWalletPhoneNo: systemWalletPhoneNo!,
      })
      if (amount < order.deliveryCharge.toNumber()) {
        throw new ApiError(400, 'Insufficient amount to pay for the order')
      }

      const updatedOrder = await prisma.$transaction(async tx => {
        const payment = await paymentService.createPayment({
          tx,
          paymentType: 'ORDER_PAYMENT',
          amount,
          transactionId,
          sender: 'SELLER',
          userWalletName: sellerWalletName,
          userWalletPhoneNo: sellerWalletPhoneNo,
          systemWalletPhoneNo,
          userName: user.name,
          userPhoneNo: user.phoneNo,
        })
        const updatedOrder = await tx.order.update({
          where: { orderId },
          data: {
            orderStatus: 'PAID',
            paymentType: paymentMethod,
            isDeliveryChargePaid: true,
            deliveryChargePaidAt: new Date(),
            paymentVerified: false,
            cashOnAmount: order.totalProductSellingPrice,
            Payment: {
              connect: { paymentId: payment.paymentId },
            },
          },
        })
        return updatedOrder
      })
      try {
        const phoneNumbers = await this.getOrderSmsRecipients()
        console.clear()
        console.log('Order SMS recipients:', phoneNumbers)
        await SmsServices.sendOrderNotificationToAdmin({
          mobileNo: phoneNumbers,
          orderId: order.orderId,
        })
      } catch (error) {
        console.error('Error sending order SMS:', error)
      }
      return updatedOrder
    }
  }
  public async cancelOrderBySeller({
    userId,
    orderId,
    reason,
  }: {
    userId: string
    orderId: number
    reason: string
  }) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const order = await prisma.order.findUnique({
      where: { orderId, sellerId: userId },
      include: { OrderProduct: true },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (!(order.orderStatus === 'UNPAID' || order.orderStatus === 'PAID')) {
      throw new ApiError(400, 'Only unpaid or paid orders can be canceled')
    }
    if (order.cancelled) {
      throw new ApiError(400, 'Order already cancelled by you')
    }

    if (order.orderStatus === 'UNPAID') {
      return await prisma.order.update({
        where: { orderId },
        data: {
          cancelled: true,
          cancelledReason: reason,
          cancelledBy: 'SELLER',
          cancelledAt: new Date(),
          orderStatus: 'CANCELLED',
        },
      })
    } else {
      return await prisma.order.update({
        where: { orderId },
        data: {
          cancelled: true,
          cancelledReason: reason,
          cancelledBy: 'SELLER',
          cancelledAt: new Date(),
        },
      })
    }
  }
  public async confirmOrderBySeller({
    userId,
    orderId,
  }: {
    userId: string
    orderId: number
  }) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const order = await prisma.order.findUnique({
      where: { orderId, sellerId: userId },
      include: { OrderProduct: true },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }

    if (order.cancelled) {
      throw new ApiError(400, 'Order already cancelled by you')
    }
    if (order.orderStatus === 'PAID') {
      throw new ApiError(400, 'Order already paid')
    }
    if (order.orderStatus === 'UNPAID' && !order.sellerVerified) {
      throw new ApiError(
        400,
        'Only unpaid orders can be confirmed by verified sellers',
      )
    }
    if (order.orderStatus !== 'UNPAID') {
      throw new ApiError(400, 'Only unpaid orders can be confirmed')
    }

    const result = await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'CONFIRMED',
        cashOnAmount: order.totalProductSellingPrice.add(
          order.deliveryCharge.toNumber(),
        ),
      },
    })
    if (result) {
      try {
        const phoneNumbers = await this.getOrderSmsRecipients()
        console.clear()
        console.log('Order SMS recipients:', phoneNumbers)
        await SmsServices.sendOrderNotificationToAdmin({
          mobileNo: phoneNumbers,
          orderId: order.orderId,
        })
      } catch (error) {
        console.error('Error sending order SMS:', error)
      }
    }
    return result
  }
  public async confirmOrderByAdmin({
    tx,
    orderId,
  }: {
    tx?: Prisma.TransactionClient
    orderId: number
  }) {
    const order = await (tx || prisma).order.findUnique({
      where: { orderId },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus !== 'PAID') {
      throw new ApiError(400, 'Only paid orders can be confirmed')
    }
    const result = await (tx || prisma).order.update({
      where: { orderId },
      data: {
        orderStatus: 'CONFIRMED',
      },
    })

    return result
  }
  public async deliverOrderByAdmin({
    adminId,
    orderId,
    trackingUrl,
  }: {
    adminId: string
    orderId: number
    trackingUrl?: string
  }) {
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE,
    )
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { OrderProduct: true },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    await this.checkExistingTrackingUrl(trackingUrl)
    if (order.orderStatus !== 'CONFIRMED') {
      throw new ApiError(400, 'Only confirmed orders can be delivered')
    }
    // await SmsServices.notifyOrderShipped({
    //   sellerPhoneNo: order.sellerPhoneNo!,
    //   orderId: order.orderId,
    //   trackingUrl: trackingUrl || '',
    // })
    const result = await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'DELIVERED',
        trackingUrl,
      },
    })
    if (result) {
      try {
        await SmsServices.notifyOrderShipped({
          sellerPhoneNo: order.sellerPhoneNo!,
          orderId: order.orderId,
          trackingUrl: trackingUrl || '',
        })
      } catch (error) {
        console.error('Error sending order SMS:', error)
      }
    }
  }
  public async reorderFailedOrder({
    userId,
    orderId,
  }: {
    userId: string
    orderId: number
  }) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const order = await prisma.order.findUnique({
      where: { orderId },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }

    if (order.orderStatus !== 'FAILED') {
      throw new ApiError(400, 'Only failed orders can be reordered')
    }

    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'CONFIRMED',
        trackingUrl: null,
      },
    })
    return updatedOrder
  }
  public async rejectOrderByAdmin({
    tx,
    orderId,
  }: {
    tx?: Prisma.TransactionClient
    orderId: number
  }) {
    const order = await (tx || prisma).order.findUnique({
      where: { orderId },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus === 'CANCELLED') {
      return await (tx || prisma).order.update({
        where: { orderId },
        data: {
          orderStatus: 'CANCELLED',
        },
      })
    }
    return await (tx || prisma).order.update({
      where: { orderId },
      data: {
        orderStatus: 'REJECTED',
      },
    })
  }
  public async getOrdersForAdmin({
    adminId,
    orderStatus,
    page,
    limit,
    search,
  }: {
    adminId: string
    orderStatus?: OrderStatus | OrderStatus[]
    page?: number
    limit?: number
    search?: string
  }) {
    // check admin permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.READ,
    )
    const where: Prisma.OrderWhereInput = {}
    if (orderStatus) {
      where.orderStatus = Array.isArray(orderStatus)
        ? { in: orderStatus }
        : orderStatus
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhoneNo: { contains: search, mode: 'insensitive' } },
        {
          sellerPhoneNo: { contains: search, mode: 'insensitive' },
        },
        {
          sellerName: { contains: search, mode: 'insensitive' },
        },
      ]
    }
    const skip = ((page || 1) - 1) * (limit || 10)
    const orders = await prisma.order
      .findMany({
        where,
        skip,
        take: limit || 10,
        include: {
          OrderProduct: true,
          Payment: true,
        },
      })
      .then(orders =>
        orders.map(order => ({
          ...order,
          OrderProduct: order.OrderProduct.map(product => ({
            ...product,
            productVariant: JSON.parse(product.productVariant as string),
          })),
        })),
      )
    const totalOrders = await prisma.order.count({
      where,
    })
    return {
      orders,
      totalOrders,
      currentPage: page || 1,
      totalPages: Math.ceil(totalOrders / (limit || 10)),
      pageSize: limit || 10,
    }
  }
  public async cancelOrderByAdmin({
    adminId,
    orderId,
    reason,
  }: {
    adminId: string
    orderId: number
    reason: string
  }) {
    // check admin permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE,
    )
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        Payment: true,
      },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus !== 'CONFIRMED') {
      throw new ApiError(400, 'Only confirmed orders can be cancelled by admin')
    }
    if (
      order.Payment?.paymentStatus === 'COMPLETED' ||
      order.paymentType === 'BALANCE'
    ) {
      // we need to refund the payment to the seller and update the order status as refunded within the transaction
      const result = await prisma.$transaction(async tx => {
        await transactionServices.createTransaction({
          tx,
          userId: order.sellerId!,
          transactionType: 'Credit',
          amount: order.deliveryCharge.toNumber(),
          reason: 'অর্ডার বাতিলের জন্য রিফান্ড',
        })
        await tx.order.update({
          where: { orderId },
          data: {
            orderStatus: 'REFUNDED',
            cancelledReason: reason,
            cancelledBy: 'SYSTEM',
            cancelledAt: new Date(),
          },
        })
        return order
      })
      return result
    }
    return await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'CANCELLED',
        cancelledReason: reason,
        cancelledBy: 'SYSTEM',
        cancelledAt: new Date(),
      },
    })
  }
  public async completeOrderByAdmin({
    adminId,
    orderId,
    amountPaidByCustomer,
  }: {
    adminId: string
    orderId: number
    amountPaidByCustomer: number
  }) {
    // check admin permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE,
    )
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        Payment: true,
      },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus !== 'DELIVERED') {
      throw new ApiError(400, 'Only delivered orders can be completed by admin')
    }
    if (!order.cashOnAmount) {
      throw new ApiError(400, 'Cash on amount is not set for this order')
    }
    const minimumAmountToBePaid = order.totalProductBasePrice
      .add(order.cashOnAmount)
      .sub(order.totalProductSellingPrice)

    if (amountPaidByCustomer < minimumAmountToBePaid.toNumber()) {
      throw new ApiError(
        400,
        `ন্যূনতম পরিশোধ : ${minimumAmountToBePaid.toFixed(2)} টাকা`,
      )
    }
    const actualCommission =
      amountPaidByCustomer - minimumAmountToBePaid.toNumber()

    const result = await prisma.$transaction(async tx => {
      // Update order status to COMPLETED
      const updatedOrder = await tx.order.update({
        where: { orderId },
        data: {
          orderStatus: 'COMPLETED',
          actualCommission,
          amountPaidByCustomer,
        },
      })
      // count how many orders the seller has completed
      const completedOrdersCount = await tx.order.count({
        where: {
          sellerId: updatedOrder.sellerId,
          orderStatus: 'COMPLETED',
        },
      })
      if (completedOrdersCount >= config.minimumOrderCompletedToBeVerified) {
        await userServices.verifySeller({ tx, userId: updatedOrder.sellerId! })
      }
      // add seller commission to seller wallet
      await transactionServices.createTransaction({
        tx,
        userId: updatedOrder.sellerId!,
        transactionType: 'Credit',
        amount: actualCommission,
        reason: 'অর্ডার সম্পন্নের কমিশন',
      })
      return updatedOrder
    })
    if (result.orderStatus === 'COMPLETED') {
      try {
        const referrers = await commissionServices.calculateUserCommissions(
          order.sellerPhoneNo!,
          order.totalProductSellingPrice.toNumber(),
        )
        if (referrers.length > 0) {
          const sendCommissions = await prisma.$transaction(async tx => {
            const commissionPromises = referrers.map(referrer => {
              return transactionServices.createTransaction({
                tx,
                userId: referrer.userId,
                amount: referrer.commissionAmount,
                reason: `রেফারেল কমিশন`,
                transactionType: 'Credit',
                reference: {
                  seller: result.sellerName,
                  level: referrer.level,
                  orderId: result.orderId,
                },
              })
            })
            return await Promise.all(commissionPromises)
          })
        }
      } catch (error) {
        console.log('Failed to send commissions:', error)
      }
    }
    try {
      await SmsServices.notifyOrderCompleted({
        sellerPhoneNo: order.sellerPhoneNo!,
        orderId: order.orderId,
        commission: result.actualCommission!.toNumber() || 0,
        orderAmount: result.totalProductSellingPrice.toNumber(),
      })
    } catch (error) {
      console.error('Error sending order SMS:', error)
    }
    return result
  }
  public async returnOrderByAdmin({
    adminId,
    orderId,
  }: {
    adminId: string
    orderId: number
  }) {
    // check admin permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE,
    )
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        Payment: true,
      },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus !== 'DELIVERED') {
      throw new ApiError(400, 'Only delivered orders can be returned')
    }
    if (!order.Payment && order.paymentType !== 'BALANCE') {
      // we need to deduct the delivery charge from the seller's balance and update the order status as returned within the transaction
      const result = await prisma.$transaction(async tx => {
        await transactionServices.createTransaction({
          tx,
          userId: order.sellerId!,
          transactionType: 'Debit',
          amount: order.deliveryCharge.toNumber(),
          reason: 'অর্ডার ফেরত দেওয়ার জন্য ডেলিভারি চার্জ কর্তন',
        })
        await tx.order.update({
          where: { orderId },
          data: {
            orderStatus: 'RETURNED',
          },
        })
        return order
      })
      return result
    } else {
      // just update the order status to returned
      return await prisma.order.update({
        where: { orderId },
        data: {
          orderStatus: 'RETURNED',
        },
      })
    }
  }
  public async markOrderAsFailed({
    adminId,
    orderId,
  }: {
    adminId: string
    orderId: number
  }) {
    // check admin permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE,
    )
    const order = await prisma.order.findUnique({
      where: { orderId },
    })
    if (!order) {
      throw new ApiError(404, 'Order not found')
    }
    if (order.orderStatus !== 'DELIVERED') {
      throw new ApiError(400, 'Only delivered orders can be marked as failed')
    }
    return await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'FAILED',
      },
    })
  }
}
export const orderService = new OrderService()
