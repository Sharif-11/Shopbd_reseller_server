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
import SmsServices from '../Utility Services/Sms Service/sms.services'

import { transactionServices } from '../Utility Services/Transaction Services/transaction.services'
import walletServices from '../WalletManagement/wallet.services'
import { OrderData } from './order.types'

class OrderService {
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
      customerZilla === shop.shopLocation
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
    console.log(typeof order)
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
        {
          transactionId: { contains: search },
        },
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

    return await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'CONFIRMED',
        cashOnAmount: order.totalProductSellingPrice.add(
          order.deliveryCharge.toNumber(),
        ),
      },
    })
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
    return await (tx || prisma).order.update({
      where: { orderId },
      data: {
        orderStatus: 'CONFIRMED',
      },
    })
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
    if (order.orderStatus !== 'CONFIRMED') {
      throw new ApiError(400, 'Only confirmed orders can be delivered')
    }
    await SmsServices.notifyOrderShipped({
      sellerPhoneNo: order.sellerPhoneNo!,
      orderId: order.orderId,
      trackingUrl: trackingUrl || '',
    })
    return await prisma.order.update({
      where: { orderId },
      data: {
        orderStatus: 'DELIVERED',
        trackingUrl,
      },
    })
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
}
export const orderService = new OrderService()
