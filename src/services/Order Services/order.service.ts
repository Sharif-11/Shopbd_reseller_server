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

import axios from 'axios'
import commissionServices from '../Commission Management/commission.services'
import SmsServices from '../Utility Services/Sms Service/sms.services'
import { transactionServices } from '../Utility Services/Transaction Services/transaction.services'
import walletServices from '../WalletManagement/wallet.services'
import { OrderData, OrderProductData } from './order.types'

class OrderService {
  private fraudCheckCache = new Map<string, any>()
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
    const orderSmsRecipients = await userServices.getSmsRecipientsForPermission(
      PermissionType.ORDER_MANAGEMENT,
    )
    return orderSmsRecipients
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

    const deliveryCharge = await this.calculateDeliveryCharge({
      shopId,
      customerZilla,
      productQuantity: verifiedOrderData.totalProductQuantity,
    })
    // check if there is an unpaid order for the seller
    const existingOrder = await prisma.order.findFirst({
      where: {
        sellerId,
        orderStatus: 'UNPAID',
        orderType: 'SELLER_ORDER',
      },
    })
    if (existingOrder) {
      throw new ApiError(
        400,
        'আপনার একটি পেমেন্ট করা হয়নি এমন অর্ডার রয়েছে। নতুন অর্ডার করার আগে অনুগ্রহ করে সেটি পেমেন্ট করুন অথবা কনফার্ম করুন।',
      )
    }
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
  public async createCustomerOrder({
    shopId,
    customerName,
    customerPhoneNo,
    customerZilla,
    customerUpazilla,
    deliveryAddress,
    comments,
    products,
  }: {
    shopId: number
    customerName: string
    customerPhoneNo: string
    customerZilla: string
    customerUpazilla: string
    deliveryAddress: string
    comments?: string
    products: OrderProductData[]
  }) {
    // find customer by phone number
    const customer = await userServices.getCustomerByPhoneNo({
      customerPhoneNo,
    })
    const isBlocked = await blockServices.isUserBlocked(
      customerPhoneNo,
      BlockActionType.ORDER_REQUEST,
    )
    if (isBlocked) {
      throw new Error(
        'You are blocked from placing orders. Please contact support.',
      )
    }
    const shop = await shopCategoryServices.checkShopStatus(shopId)
    if (!shop || !shop.isActive) {
      throw new ApiError(400, 'Shop is not active')
    }
    const { shopName, shopLocation } = shop
    const verifiedOrderData =
      await productServices.verifyOrderProducts(products)

    const deliveryCharge = await this.calculateDeliveryCharge({
      shopId,
      customerZilla,
      productQuantity: verifiedOrderData.totalProductQuantity,
    })
    // check if there is an unpaid order for the customer
    const existingOrder = await prisma.order.findFirst({
      where: {
        customerPhoneNo,
        orderStatus: 'UNPAID',
        orderType: 'CUSTOMER_ORDER',
      },
    })
    if (existingOrder) {
      throw new ApiError(
        400,
        'আপনার একটি পেমেন্ট করা হয়নি এমন অর্ডার রয়েছে। নতুন অর্ডার করার আগে অনুগ্রহ করে সেটি পেমেন্ট করুন।',
      )
    }

    // now create order connecting with payment
    const order = await prisma.order.create({
      data: {
        shopId,
        customerName,
        customerPhoneNo,
        customerZilla,
        customerUpazilla,
        customerAddress: deliveryAddress,
        customerComments: comments,
        shopName,
        shopLocation,
        isDeliveryChargePaid: false,
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
        sellerId: customer?.sellerId || '',
        sellerName: customer?.sellerName || '',
        sellerPhoneNo: customer?.sellerPhone || '',
        orderStatus: 'UNPAID',
        orderType: 'CUSTOMER_ORDER',

        totalCommission: verifiedOrderData.totalCommission,
        actualCommission: verifiedOrderData.totalCommission,
        totalProductBasePrice: verifiedOrderData.totalProductBasePrice,
        totalProductSellingPrice: verifiedOrderData.totalProductSellingPrice,
        totalProductQuantity: verifiedOrderData.totalProductQuantity,
      },
    })
    // send order notification to admin

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
  public async getCustomerOrders({
    phoneNo,
    orderStatus,
    page,
    limit,
    search,
  }: {
    phoneNo: string
    orderStatus?: OrderStatus | OrderStatus[]
    page?: number
    limit?: number
    search?: string
  }) {
    const customer = await userServices.getCustomerByPhoneNo({
      customerPhoneNo: phoneNo,
    })

    const where: any = {
      sellerId: customer?.sellerId,
      orderType: 'CUSTOMER_ORDER',
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
        try {
          const phoneNumbers = await this.getOrderSmsRecipients()
          console.clear()
          console.log(phoneNumbers)

          await SmsServices.sendOrderNotificationToAdmin({
            mobileNo: phoneNumbers,
            orderId: order.orderId,
          })
        } catch (error) {
          console.error('Error sending order SMS:', error)
        }
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
  public async orderPaymentByCustomer({
    orderId,
    customerWalletName,
    customerWalletPhoneNo,
    systemWalletPhoneNo,
    amount,
    transactionId,
  }: {
    orderId: number
    customerWalletName: string
    customerWalletPhoneNo: string
    systemWalletPhoneNo: string
    amount: number
    transactionId: string
  }) {
    const order = await prisma.order.findUnique({
      where: { orderId },
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

    if (
      !systemWalletPhoneNo ||
      !customerWalletName ||
      !customerWalletPhoneNo ||
      !amount ||
      !transactionId
    ) {
      throw new ApiError(400, 'Missing required fields')
    }
    const systemWallet = await walletServices.verifySystemWalletOwnership({
      systemWalletName: customerWalletName!,
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
        sender: 'CUSTOMER',
        userWalletName: customerWalletName,
        userWalletPhoneNo: customerWalletPhoneNo,
        systemWalletPhoneNo,
        userName: order.customerName,
        userPhoneNo: order.customerPhoneNo,
      })
      const updatedOrder = await tx.order.update({
        where: { orderId },
        data: {
          orderStatus: 'PAID',
          paymentType: 'WALLET',
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

      await SmsServices.sendOrderNotificationToAdmin({
        mobileNo: phoneNumbers,
        orderId: order.orderId,
      })
    } catch (error) {
      console.error('Error sending order SMS:', error)
    }
    return updatedOrder
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
  public async cancelOrderByCustomer({
    phoneNo,
    orderId,
    reason,
  }: {
    phoneNo: string
    orderId: number
    reason: string
  }) {
    const customer = await userServices.getCustomerByPhoneNo({
      customerPhoneNo: phoneNo,
    })

    const order = await prisma.order.findUnique({
      where: { orderId, sellerId: customer?.sellerId },
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
          cancelledBy: 'CUSTOMER',
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
          cancelledBy: 'CUSTOMER',
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
    // await this.checkExistingTrackingUrl(trackingUrl?.trim())
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
        trackingUrl: trackingUrl?.trim() || null,
      },
    })
    if (result) {
      try {
        await SmsServices.notifyOrderShipped({
          sellerPhoneNo:
            result.orderType === 'SELLER_ORDER'
              ? order.sellerPhoneNo!
              : order.customerPhoneNo,
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
    transactionId?: string
    systemWalletPhoneNo?: string
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
    if (order.orderType === 'SELLER_ORDER') {
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
    } else {
      const customer = await userServices.getCustomerByPhoneNo({
        customerPhoneNo: order.customerPhoneNo,
      })
      if (!customer) {
        throw new ApiError(404, 'Customer not found')
      }
      // handle customer order cancellation
      if (order?.Payment?.paymentStatus === 'COMPLETED') {
        const result = await prisma.$transaction(async tx => {
          await transactionServices.createTransactionForCustomer({
            tx,
            customerId: customer.customerId!,
            amount: order.deliveryCharge.toNumber(),
            reason: 'অর্ডার বাতিলের জন্য রিফান্ড',
            transactionType: 'Credit',
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
      } else {
        const updatedOrder = await prisma.order.update({
          where: { orderId },
          data: {
            orderStatus: 'CANCELLED',
            cancelledReason: reason,
            cancelledBy: 'SYSTEM',
            cancelledAt: new Date(),
          },
        })
        return updatedOrder
      }
    }
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
      actualCommission > 0 &&
        (await transactionServices.createTransaction({
          tx,
          userId: updatedOrder.sellerId!,
          transactionType: 'Credit',
          amount:
            order.orderType === 'SELLER_ORDER'
              ? actualCommission
              : config.sellerCommissionRate * actualCommission,
          reason: 'অর্ডার সম্পন্নের কমিশন',
          reference:
            order.orderType === 'CUSTOMER_ORDER'
              ? {
                  customerName: updatedOrder.customerName,
                  customerPhoneNo: updatedOrder.customerPhoneNo,
                  orderId: updatedOrder.orderId,
                }
              : undefined,
        }))
      return updatedOrder
    })
    if (
      result.orderStatus === 'COMPLETED' &&
      result.orderType === 'SELLER_ORDER'
    ) {
      try {
        const referrers = await commissionServices.calculateUserCommissions(
          order.sellerPhoneNo!,
          order.totalProductBasePrice.toNumber(),
        )
        if (referrers.length > 0) {
          await prisma.$transaction(
            async tx => {
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
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
              timeout: referrers.length * 2000 + 5000,
            },
          )
        }
      } catch (error) {
        console.log('Failed to send commissions:', error)
      }
    }
    try {
      await SmsServices.notifyOrderCompleted({
        sellerPhoneNo:
          order.orderType === 'SELLER_ORDER'
            ? order.sellerPhoneNo!
            : order.customerPhoneNo,
        orderId: order.orderId,
        commission: result.actualCommission!.toNumber() || 0,
        orderAmount: result.totalProductSellingPrice.toNumber(),
        orderType: result.orderType,
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
  public async getOrderStatisticsForAdmin({ adminId }: { adminId: string }) {
    // Check admin permission
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.DASHBOARD_ANALYTICS,
      ActionType.READ,
    )

    // Calculate date boundaries once
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch all necessary data in parallel
    const [allOrders, allOrderProducts] = await Promise.all([
      prisma.order.findMany({
        include: {
          OrderProduct: true,
        },
      }),
      prisma.orderProduct.findMany({
        include: {
          order: true,
        },
      }),
    ])

    // Initialize counters
    let totalSales = 0
    let totalCommission = 0
    let completedOrdersCount = 0
    let last30DaysCompleted = 0
    let last7DaysCompleted = 0
    let totalProductsSold = 0
    let last7daysTotalSales = 0
    let last30daysTotalSales = 0

    // Process orders
    for (const order of allOrders) {
      if (order.orderStatus === 'COMPLETED') {
        totalSales += order.amountPaidByCustomer?.toNumber() || 0
        totalCommission += order.actualCommission?.toNumber() || 0
        completedOrdersCount++

        // Check recent completed orders
        if (order.createdAt >= thirtyDaysAgo) {
          last30DaysCompleted++
          last30daysTotalSales += order.amountPaidByCustomer?.toNumber() || 0
        }
        if (order.createdAt >= sevenDaysAgo) {
          last7DaysCompleted++
          last7daysTotalSales += order.amountPaidByCustomer?.toNumber() || 0
        }
      }
    }

    // Process order products
    for (const orderProduct of allOrderProducts) {
      if (orderProduct.order.orderStatus === 'COMPLETED') {
        totalProductsSold += orderProduct.productQuantity || 0
      }
    }

    return {
      totalOrders: allOrders.length,
      totalSales,
      totalCommission,
      totalProductsSold,
      totalOrdersCompleted: completedOrdersCount,
      totalOrdersCompletedLast30Days: last30DaysCompleted,
      totalOrdersCompletedLast7Days: last7DaysCompleted,
      totalSalesLast30Days: last30daysTotalSales,
      totalSalesLast7Days: last7daysTotalSales,
    }
  }
  public async getOrderStatisticsForSeller(userId: string) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // Calculate date ranges
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all orders for the seller
    const orders = await prisma.order.findMany({
      where: { sellerId: userId },
      include: {
        OrderProduct: true,
      },
    })

    // Filter orders for different time periods
    const last7DaysOrders = orders.filter(
      order => new Date(order.createdAt) >= sevenDaysAgo,
    )
    const last30DaysOrders = orders.filter(
      order => new Date(order.createdAt) >= thirtyDaysAgo,
    )

    // Function to calculate statistics for a given order set
    const calculateStats = (orderSet: typeof orders) => {
      let totalSales = 0
      let totalCommission = 0
      let completedOrdersCount = 0
      let totalProductsSold = 0

      for (const order of orderSet) {
        if (order.orderStatus === 'COMPLETED') {
          totalSales += order.totalProductSellingPrice?.toNumber() || 0
          totalCommission += order.actualCommission?.toNumber() || 0
          completedOrdersCount++
        }
        for (const product of order.OrderProduct) {
          if (order.orderStatus === 'COMPLETED') {
            totalProductsSold += product.productQuantity || 0
          }
        }
      }

      return {
        totalOrders: orderSet.length,
        totalSales,
        totalCommission,
        totalProductsSold,
        totalOrdersCompleted: completedOrdersCount,
      }
    }

    // Calculate statistics for all time, last 30 days, and last 7 days
    const allTimeStats = calculateStats(orders)
    const last30DaysStats = calculateStats(last30DaysOrders)
    const last7DaysStats = calculateStats(last7DaysOrders)

    return {
      allTime: allTimeStats,
      last30Days: last30DaysStats,
      last7Days: last7DaysStats,
    }
  }
  public async getTrendingTopSellingProducts(
    daysBack: number = 30,
    isSeller: boolean = false,
    page: number = 1,
    limit: number = 10,
  ) {
    const now = new Date()
    const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const trendingProducts = await prisma.orderProduct.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        productQuantity: true,
      },
      where: {
        order: {
          createdAt: {
            gte: pastDate,
          },
          orderStatus: 'COMPLETED',
        },
      },
      orderBy: {
        _sum: {
          productQuantity: 'desc',
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    })
    const trendingProductCount = await prisma.orderProduct.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        productQuantity: true,
      },
      where: {
        order: {
          createdAt: {
            gte: pastDate,
          },
          orderStatus: 'COMPLETED',
        },
      },
      orderBy: {
        _sum: {
          productQuantity: 'desc',
        },
      },
      take: 30,
    })
    // fetch product details for each trending product
    let data = []
    if (trendingProducts.length === 0) {
      return []
    }
    const productIds = trendingProducts.map(product => product.productId)
    const products = await prisma.product.findMany({
      where: {
        productId: { in: productIds },
      },
      select: {
        productId: true,
        name: true,
        basePrice: true,
        suggestedMaxPrice: true,
        // custom property price

        shop: { select: { shopName: true, shopLocation: true } },
        // only select the first image for simplicity
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })

    // Combine product details with sales data
    data = trendingProducts.map(product => {
      const productDetails = products.find(
        p => p.productId === product.productId,
      )
      return {
        ...productDetails,
        price: isSeller
          ? productDetails!.basePrice
          : productDetails!.suggestedMaxPrice,
        totalSold: product._sum.productQuantity || 0,
      }
    })
    return {
      data,
      total: trendingProductCount.length,
      page,
      limit,
      totalPages: Math.ceil(trendingProductCount.length / limit),
    }
  }
  async fraudChecker(phoneNumber: string) {
    if (this.fraudCheckCache.has(phoneNumber)) {
      return this.fraudCheckCache.get(phoneNumber)
    }
    const url = `https://fraudchecker.link/api/v1/qc/`
    // now i need to hit the fraud checker API via axios with authentication token
    try {
      const params = new URLSearchParams()
      params.append('phone', phoneNumber)

      const response = await axios.post(
        'https://fraudchecker.link/api/v1/qc/',
        params,
        {
          headers: {
            Authorization: `Bearer ${process.env.FRAUD_CHECKER_TOKEN}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )

      console.log('Fraud check response:', response.status)
      this.fraudCheckCache.set(phoneNumber, response.data)
      return response.data
    } catch (error) {
      // console.error('Error checking fraud:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        console.log('Error checking fraud:', (error as any).response?.data)
        console.log(
          'Error checking fraud status:',
          (error as any).response?.status,
        )
      } else {
        console.log('Error checking fraud:', error)
      }
      throw new ApiError(
        (error as any).response?.status,
        (error as any).response?.data.message,
      )
    }
  }
}
export const orderService = new OrderService()
