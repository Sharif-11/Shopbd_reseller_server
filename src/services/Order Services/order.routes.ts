import { Router } from 'express'
import { isAuthenticated, verifyRole } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import orderControllers from './order.controllers'
import OrderValidator from './order.validator'

class OrderRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // ==========================================
    // ORDER MANAGEMENT ROUTES
    // ==========================================

    this.router.post(
      '/seller',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.createSellerOrder(),
      validateRequest,
      orderControllers.createSellerOrder
    )

    this.router.get(
      '/seller',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.getSellerOrders(),
      validateRequest,
      orderControllers.getSellerOrders
    )

    this.router.post(
      '/seller/payment',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.orderPaymentBySeller(),
      validateRequest,
      orderControllers.orderPaymentBySeller
    )

    this.router.post(
      '/seller/cancel',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.cancelOrderBySeller(),
      validateRequest,
      orderControllers.cancelOrderBySeller
    )
    this.router.post(
      '/seller/confirm/:orderId',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.confirmOrderBySeller(),
      validateRequest,
      orderControllers.confirmOrderBySeller
    )
    this.router.post(
      '/seller/re-order/:orderId',
      isAuthenticated,
      verifyRole('Seller'),

      orderControllers.reorderFailedOrder
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new OrderRouter().getRouter()
