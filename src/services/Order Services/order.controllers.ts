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
  async createCustomerOrder(req: Request, res: Response, next: NextFunction) {
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

      const order = await orderService.createCustomerOrder({
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
  async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderStatus, page, limit, search, phoneNo } = req.query

      const orders = await orderService.getCustomerOrders({
        orderStatus: orderStatus as OrderStatus | OrderStatus[],
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        phoneNo: phoneNo as string,
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
  async getAllReferredOrdersForASeller(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId
      const { page, limit, search, orderStatus } = req.query
      const orders = await orderService.getAllReferredOrdersForASeller({
        userId: userId!,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        orderStatus: orderStatus! as OrderStatus | OrderStatus[],
      })
      res.status(200).json({
        statusCode: 200,
        message: 'All referral orders retrieved successfully',
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
  async orderPaymentByCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        orderId,
        customerWalletName,
        customerWalletPhoneNo,
        systemWalletPhoneNo,
        amount,
        transactionId,
      } = req.body

      const order = await orderService.orderPaymentByCustomer({
        orderId: Number(orderId),
        customerWalletName,
        customerWalletPhoneNo,
        systemWalletPhoneNo,
        amount: amount as number,
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
  async cancelOrderByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderId, reason, phoneNo } = req.body

      const order = await orderService.cancelOrderByCustomer({
        phoneNo,
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

  async reorderFailedOrderBySeller(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId
      const { orderId } = req.params

      const order = await orderService.reorderFailedOrderBySeller({
        userId: userId!,
        orderId: Number(orderId),
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order reordered successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
  async reorderFailedOrderByCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { phoneNo } = req.body
      const { orderId } = req.params

      const order = await orderService.reorderFailedOrderByCustomer({
        customerPhoneNo: phoneNo,
        orderId: Number(orderId),
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Order reordered successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async confirmOrderByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params
      const order = await orderService.confirmOrderByAdmin({
        orderId: Number(orderId),
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Order confirmed by admin successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async deliverOrderByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params
      const { trackingUrl } = req.body
      const order = await orderService.deliverOrderByAdmin({
        adminId: req.user?.userId!,
        orderId: Number(orderId),
        trackingUrl,
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Order delivered successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }

  async rejectOrderByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params
      const order = await orderService.rejectOrderByAdmin({
        orderId: Number(orderId),
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Order rejected successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
  async getAllOrdersForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { page, limit, search, orderStatus } = req.query
      const orders = await orderService.getOrdersForAdmin({
        adminId: userId!,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
        orderStatus: orderStatus! as OrderStatus | OrderStatus[],
      })
      res.status(200).json({
        statusCode: 200,
        message: 'All orders retrieved successfully',
        success: true,
        data: orders,
      })
    } catch (error) {
      next(error)
    }
  }
  async cancelOrderByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderId } = req.params
      const { reason } = req.body
      const order = await orderService.cancelOrderByAdmin({
        orderId: Number(orderId),
        reason,
        adminId: userId!,
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
  async completeOrderByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderId } = req.params
      const { amountPaidByCustomer } = req.body
      const order = await orderService.completeOrderByAdmin({
        orderId: Number(orderId),
        adminId: userId!,
        amountPaidByCustomer,
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Order completed successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
  async returnOrderByAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { orderId } = req.params
      const { reason } = req.body
      const order = await orderService.returnOrderByAdmin({
        orderId: Number(orderId),
        adminId: userId!,
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Order returned successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
  async markOrderAsFailedByAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId
      const { orderId } = req.params
      const order = await orderService.markOrderAsFailed({
        orderId: Number(orderId),
        adminId: userId!,
      })
      res.status(200).json({
        statusCode: 200,
        message: 'Order marked as failed successfully',
        success: true,
        data: order,
      })
    } catch (error) {
      next(error)
    }
  }
  async getTrendingTopSellingProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = req.user
      const products = await orderService.getTrendingTopSellingProducts(
        30,
        Boolean(user)
      )
      res.status(200).json({
        statusCode: 200,
        message: 'Trending top-selling products retrieved successfully',
        success: true,
        data: products,
      })
    } catch (error) {
      throw error
    }
  }
  async getAllReferredOrdersForSeller(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId
      const { page, limit } = req.query
      const orders = await orderService.getAllReferredOrdersForSeller({
        sellerId: userId!,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      })
      res.status(200).json({
        statusCode: 200,
        message: 'All referred orders retrieved successfully',
        success: true,
        data: orders,
      })
    } catch (error) {
      next(error)
    }
  }
  async getAllCustomerOrdersForSeller(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.userId
      const { page, limit } = req.query
      const orders = await orderService.getAllCustomerOrdersForSeller({
        sellerId: userId!,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      })
      res.status(200).json({
        statusCode: 200,
        message: 'All customer orders retrieved successfully',
        success: true,
        data: orders,
      })
    } catch (error) {
      next(error)
    }
  }
  async checkFraud(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber } = req.params
      const token = req.headers.authorization?.split(' ')[1]

      const response = await orderService.fraudChecker(phoneNumber)

      res.status(200).json({
        statusCode: 200,
        message: 'Fraud check completed successfully',
        success: true,
        data: response,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new OrderController()
