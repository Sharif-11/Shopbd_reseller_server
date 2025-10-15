import { Router } from 'express'
import {
  authenticate,
  isAuthenticated,
  verifyRole,
} from '../../middlewares/auth.middlewares'
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
    // SELLER ORDER MANAGEMENT ROUTES
    // ==========================================
    this.router.get(
      '/fraud-check/:phoneNumber',
      OrderValidator.checkFraud(),
      validateRequest,
      orderControllers.checkFraud,
    )
    this.router.post(
      '/seller',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.createSellerOrder(),
      validateRequest,
      orderControllers.createSellerOrder,
    )
    this.router.post(
      '/customer',
      // isAuthenticated,
      // verifyRole('Customer'),
      OrderValidator.createCustomerOrder(),
      validateRequest,
      orderControllers.createCustomerOrder,
    )

    this.router.get(
      '/seller',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.getSellerOrders(),
      validateRequest,
      orderControllers.getSellerOrders,
    )
    this.router.get(
      '/seller/referral',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.getAllReferredOrdersForSeller(),
      validateRequest,
      orderControllers.getAllReferredOrdersForSeller,
    )
    this.router.get(
      '/seller/customer-referral',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.getAllReferredOrdersForSeller(),
      validateRequest,
      orderControllers.getAllCustomerOrdersForSeller,
    )
    this.router.get(
      '/customer',
      OrderValidator.getCustomerOrders(),
      validateRequest,
      orderControllers.getCustomerOrders,
    )

    this.router.post(
      '/seller/payment',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.orderPaymentBySeller(),
      validateRequest,
      orderControllers.orderPaymentBySeller,
    )
    this.router.post(
      '/customer/payment',
      OrderValidator.orderPaymentByCustomer(),
      validateRequest,
      orderControllers.orderPaymentByCustomer,
    )

    this.router.post(
      '/seller/cancel',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.cancelOrderBySeller(),
      validateRequest,
      orderControllers.cancelOrderBySeller,
    )
    this.router.post(
      '/customer/cancel',
      OrderValidator.cancelOrderByCustomer(),
      validateRequest,
      orderControllers.cancelOrderByCustomer,
    )

    this.router.post(
      '/seller/confirm/:orderId',
      isAuthenticated,
      verifyRole('Seller'),
      OrderValidator.confirmOrderBySeller(),
      validateRequest,
      orderControllers.confirmOrderBySeller,
    )

    this.router.post(
      '/seller/re-order/:orderId',
      isAuthenticated,
      verifyRole('Seller'),
      orderControllers.reorderFailedOrderBySeller,
    )
    this.router.post(
      '/customer/re-order/:orderId',
      orderControllers.reorderFailedOrderByCustomer,
    )

    // ==========================================
    // ADMIN ORDER MANAGEMENT ROUTES
    // ==========================================
    this.router.get(
      '/admin',
      isAuthenticated,
      OrderValidator.getSellerOrders(),
      validateRequest,
      orderControllers.getAllOrdersForAdmin,
    )
    this.router.delete(
      '/admin/:orderId',
      isAuthenticated,
      OrderValidator.confirmOrderByAdmin(),
      validateRequest,
      orderControllers.deleteUnpaidOrderByAdmin,
    )
    this.router.post(
      '/admin/confirm/:orderId',
      isAuthenticated,
      OrderValidator.confirmOrderByAdmin(),
      validateRequest,
      orderControllers.makeOrderConfirmedFromPendingByAdmin,
    )
    this.router.post(
      '/admin/cancel/:orderId',
      isAuthenticated,
      OrderValidator.cancelOrderByAdmin(),
      validateRequest,
      orderControllers.cancelOrderByAdmin,
    )

    this.router.post(
      '/admin/deliver/:orderId',
      isAuthenticated,
      OrderValidator.deliverOrderByAdmin(),
      validateRequest,
      orderControllers.deliverOrderByAdmin,
    )
    this.router.patch(
      '/admin/deliver/:orderId',
      isAuthenticated,
      OrderValidator.deliverOrderByAdmin(),
      validateRequest,
      orderControllers.updateTrackingUrlByAdmin,
    )
    this.router.post(
      '/admin/complete/:orderId',
      isAuthenticated,
      OrderValidator.completeOrderByAdmin(),
      validateRequest,
      orderControllers.completeOrderByAdmin,
    )
    this.router.post(
      '/admin/fail/:orderId',
      isAuthenticated,
      orderControllers.markOrderAsFailedByAdmin,
    )
    this.router.post(
      '/admin/return/:orderId',
      isAuthenticated,
      orderControllers.returnOrderByAdmin,
    )

    this.router.post(
      '/admin/reject/:orderId',
      isAuthenticated,
      OrderValidator.rejectOrderByAdmin(),
      validateRequest,
      orderControllers.rejectOrderByAdmin,
    )
    this.router.get(
      '/top-selling-products',
      authenticate,
      orderControllers.getTrendingTopSellingProducts,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

export default new OrderRouter().getRouter()
