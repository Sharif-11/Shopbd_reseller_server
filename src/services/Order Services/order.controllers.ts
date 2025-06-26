import { OrderStatus, PaymentMethod } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { orderService } from './order.service'

class OrderController {
  async createSellerOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const {
        shopId,
        customerName,
        customerPhoneNo,
        customerZilla,
        customerUpazilla,
        deliveryAddress,
        comments,
        products,
      } = req.body

      const order = await orderService.createSellerOrder(userId!, {
        shopId: Number(shopId),
        customerName,
        customerPhoneNo,
        customerZilla,
        customerUpazilla,
        deliveryAddress,
        comments,
        products,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Order created successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async getSellerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderStatus, page, limit, search } = req.query

      const orders = await orderService.getSellerOrders({
        userId: userId!,
        orderStatus: orderStatus as OrderStatus | OrderStatus[],
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Orders retrieved successfully',
        success: true,
        data: orders,
      })
    } catch (error) {
      next(error)
    }
  }

  async orderPaymentBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const {
        orderId,
        paymentMethod,
        sellerWalletName,
        sellerWalletPhoneNo,
        systemWalletPhoneNo,
        amount,
        transactionId,
      } = req.body

      const order = await orderService.orderPaymentBySeller({
        userId: userId!,
        orderId: Number(orderId),
        paymentMethod: paymentMethod as PaymentMethod,
        sellerWalletName,
        sellerWalletPhoneNo,
        systemWalletPhoneNo,
        amount: amount ? Number(amount) : undefined,
        transactionId,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order payment processed successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async cancelOrderBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderId, reason } = req.body

      const order = await orderService.cancelOrderBySeller({
        userId: userId!,
        orderId: Number(orderId),
        reason,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order cancelled successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
  async confirmOrderBySeller(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderId } = req.params

      const order = await orderService.confirmOrderBySeller({
        userId: userId!,
        orderId: Number(orderId),
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order confirmed successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new OrderController()
