import { Router } from 'express'
import { isAuthenticated } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import shopCategoryControllers from './shopCategory.controller'
import ShopCategoryValidator from './shopCategory.validator'

class ShopRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // ==========================================
    // SHOP MANAGEMENT ROUTES
    // ==========================================
    this.router.post(
      '/',
      isAuthenticated,
      ShopCategoryValidator.createShop(),
      validateRequest,
      shopCategoryControllers.createShop
    )
    this.router.get(
      '/admin',
      isAuthenticated,
      shopCategoryControllers.getAllShopsForAdmin
    )

    this.router.get(
      '/:shopId',
      ShopCategoryValidator.getShop(),
      validateRequest,
      shopCategoryControllers.getShop
    )

    this.router.get('/', shopCategoryControllers.getAllShops)

    this.router.put(
      '/:shopId',
      isAuthenticated,
      ShopCategoryValidator.updateShop(),
      validateRequest,
      shopCategoryControllers.updateShop
    )
    this.router.get(
      '/:shopId/categories',
      ShopCategoryValidator.getShopCategories(),
      validateRequest,
      shopCategoryControllers.getShopCategories
    )
    this.router.patch(
      '/:shopId/status',
      isAuthenticated,
      ShopCategoryValidator.openOrCloseShop(),
      validateRequest,
      shopCategoryControllers.openOrCloseShop
    )

    // ==========================================
    // CATEGORY MANAGEMENT ROUTES
    // ==========================================

    // ==========================================
    // SHOP-CATEGORY ASSIGNMENT ROUTES
    // ==========================================
  }

  public getRouter(): Router {
    return this.router
  }
}

// create a class router for category management
class CategoryRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // ==========================================
    // CATEGORY MANAGEMENT ROUTES
    // ==========================================
    this.router.post(
      '/',
      isAuthenticated,
      ShopCategoryValidator.createCategory(),
      validateRequest,
      shopCategoryControllers.createCategory
    )

    this.router.get(
      '/:categoryId',
      isAuthenticated,
      ShopCategoryValidator.getCategory(),
      validateRequest,
      shopCategoryControllers.getCategory
    )

    this.router.get(
      '/',
      isAuthenticated,
      shopCategoryControllers.getAllCategories
    )

    this.router.put(
      '/:categoryId',
      isAuthenticated,
      ShopCategoryValidator.updateCategory(),
      validateRequest,
      shopCategoryControllers.updateCategory
    )

    this.router.delete(
      '/:categoryId',
      isAuthenticated,
      ShopCategoryValidator.deleteCategory(),
      validateRequest,
      shopCategoryControllers.deleteCategory
    )
    this.router.get(
      '/:categoryId/shops',
      ShopCategoryValidator.getShopsByCategory(),
      validateRequest,
      shopCategoryControllers.getShopsByCategory
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// create a router for shop category assignment
class ShopCategoryAssignmentRouter {
  protected router: Router
  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }
  protected initializeRoutes(): void {
    // ==========================================
    // SHOP-CATEGORY ASSIGNMENT ROUTES
    // ==========================================
    this.router.post(
      '/',
      isAuthenticated,
      ShopCategoryValidator.assignCategoryToShop(),
      validateRequest,
      shopCategoryControllers.assignCategoryToShop
    )

    this.router.delete(
      '/:shopId/categories/:categoryId',
      isAuthenticated,
      ShopCategoryValidator.removeCategoryFromShop(),
      validateRequest,
      shopCategoryControllers.removeCategoryFromShop
    )
  }
  public getRouter(): Router {
    return this.router
  }
}
export const shopRouter = new ShopRouter().getRouter()
export const categoryRouter = new CategoryRouter().getRouter()
export const shopCategoryAssignmentRouter =
  new ShopCategoryAssignmentRouter().getRouter()

// Export a singleton instance
