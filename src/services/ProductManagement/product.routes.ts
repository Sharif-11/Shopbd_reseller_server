import { Router } from 'express'
import { isAuthenticated } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'

import productControllers from './product.controller'
import ProductValidator from './product.validator'

class ProductRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // ==========================================
    // PRODUCT CRUD ROUTES
    // ==========================================

    this.router.post(
      '/',
      isAuthenticated,
      ProductValidator.createProduct(),
      validateRequest,
      productControllers.createProduct
    )

    this.router.put(
      '/:productId',
      isAuthenticated,
      ProductValidator.updateProduct(),
      validateRequest,
      productControllers.updateProduct
    )

    this.router.patch(
      '/:productId/publish',
      isAuthenticated,
      ProductValidator.togglePublishStatus(),
      validateRequest,
      productControllers.togglePublishStatus
    )

    // ==========================================
    // VARIANT MANAGEMENT ROUTES
    // ==========================================

    this.router.get(
      '/:productId/variants',
      ProductValidator.getProductVariants(),
      validateRequest,
      productControllers.getProductVariants
    )

    this.router.put(
      '/:productId/variants',
      isAuthenticated,
      ProductValidator.replaceVariants(),
      validateRequest,
      productControllers.replaceVariants
    )

    // ==========================================
    // IMAGE MANAGEMENT ROUTES
    // ==========================================

    this.router.post(
      '/:productId/images',
      isAuthenticated,
      ProductValidator.addImages(),
      validateRequest,
      productControllers.addImages
    )

    this.router.get(
      '/:productId/images',
      ProductValidator.getImages(),
      validateRequest,
      productControllers.getImages
    )

    this.router.patch(
      '/images/:imageId',
      isAuthenticated,
      ProductValidator.updateImage(),
      validateRequest,
      productControllers.updateImage
    )

    this.router.delete(
      '/images/:imageId',
      isAuthenticated,
      ProductValidator.deleteImage(),
      validateRequest,
      productControllers.deleteImage
    )

    this.router.delete(
      '/:productId/images',
      isAuthenticated,
      ProductValidator.deleteAllImages(),
      validateRequest,
      productControllers.deleteAllImages
    )

    // ==========================================
    // PRODUCT VIEW ROUTES
    // ==========================================
    this.router.get(
      '/admin/:productId',
      isAuthenticated,
      ProductValidator.getProductDetailForAdmin(),
      validateRequest,
      productControllers.getProductDetailForAdmin
    )
    this.router.get(
      '/customer/:productId',
      ProductValidator.getProductDetailForCustomer(),
      validateRequest,
      productControllers.getProductDetailForCustomer
    )

    this.router.get(
      '/seller/:productId',
      isAuthenticated,
      ProductValidator.getProductDetailForSeller(),
      validateRequest,
      productControllers.getProductDetailForSeller
    )

    // ==========================================
    // PRODUCT LISTING ROUTES
    // ==========================================

    this.router.get(
      '/admin',
      isAuthenticated,
      ProductValidator.getAllProductsForAdmin(),
      validateRequest,
      productControllers.getAllProductsForAdmin
    )

    this.router.get(
      '/customer',
      ProductValidator.getAllProductsForCustomer(),
      validateRequest,
      productControllers.getAllProductsForCustomer
    )

    this.router.get(
      '/seller',
      isAuthenticated,
      ProductValidator.getAllProductsForSeller(),
      validateRequest,
      productControllers.getAllProductsForSeller
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new ProductRouter().getRouter()
