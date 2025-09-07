import { NextFunction, Request, Response } from 'express'
import shopCategoryServices from './shopCategory.services'

class ShopCategoryController {
  // ==========================================
  // SHOP MANAGEMENT
  // ==========================================

  async createShop(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const {
        shopName,
        shopLocation,
        deliveryChargeInside,
        deliveryChargeOutside,
        shopDescription,
        shopIcon,
      } = req.body

      const shop = await shopCategoryServices.createShop(userId!, {
        shopName,
        shopLocation,
        deliveryChargeInside,
        deliveryChargeOutside,
        shopDescription,
        shopIcon,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Shop created successfully',
        success: true,
        data: shop,
      })
    } catch (error) {
      next(error)
    }
  }

  async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params
      const shop = await shopCategoryServices.getShop(Number(shopId))

      res.status(200).json({
        statusCode: 200,
        message: 'Shop retrieved successfully',
        success: true,
        data: shop,
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllShops(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, shopName = '' } = req.query
      const pageNumber = Number(page)
      const shops = await shopCategoryServices.getAllShops(
        pageNumber,
        Number(limit),
        String(shopName),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Shops retrieved successfully',
        success: true,
        data: shops,
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllShopsForAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { page = 1, limit = 10, shopName = '' } = req.query
      const pageNumber = Number(page)
      const shops = await shopCategoryServices.getAllShopsForAdmin(
        userId!,
        pageNumber,
        Number(limit),
        String(shopName),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Shops retrieved successfully',
        success: true,
        data: shops,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { shopId } = req.params
      const {
        shopName,
        shopLocation,
        deliveryChargeInside,
        deliveryChargeOutside,
        shopDescription,
        shopIcon,
        isActive,
      } = req.body

      const shop = await shopCategoryServices.updateShop(
        userId!,
        Number(shopId),
        {
          shopName,
          shopLocation,
          deliveryChargeInside,
          deliveryChargeOutside,
          shopDescription,
          shopIcon,
          isActive,
        },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Shop updated successfully',
        success: true,
        data: shop,
      })
    } catch (error) {
      next(error)
    }
  }
  async openOrCloseShop(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId

      const { shopId } = req.params
      const { isActive } = req.body

      const shop = await shopCategoryServices.openOrCloseShop(
        userId!,
        Number(shopId),
        isActive,
      )

      res.status(200).json({
        statusCode: 200,
        message: `Shop ${isActive ? 'opened' : 'closed'} successfully`,
        success: true,
        data: shop,
      })
    } catch (error) {
      next(error)
    }
  }

  // ==========================================
  // CATEGORY MANAGEMENT
  // ==========================================

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { name, description, categoryIcon, parentId, priority } = req.body

      const category = await shopCategoryServices.createCategory(userId!, {
        name,
        description,
        categoryIcon,
        parentId: parentId ? Number(parentId) : null,
        priority: priority ? Number(priority) : 1,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Category created successfully',
        success: true,
        data: category,
      })
    } catch (error) {
      next(error)
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params
      const category = await shopCategoryServices.getCategory(
        Number(categoryId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Category retrieved successfully',
        success: true,
        data: category,
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 10,
        name = '',
        subCategories = false,
      } = req.query

      const categories = await shopCategoryServices.getAllCategories(
        Number(page),
        Number(limit),
        String(name),
        Boolean(subCategories),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Categories retrieved successfully',
        success: true,
        data: categories,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { categoryId } = req.params
      const { name, description, categoryIcon, parentId, priority } = req.body

      const category = await shopCategoryServices.updateCategory(
        userId!,
        Number(categoryId),
        {
          name,
          description,
          categoryIcon,
          parentId: parentId ? Number(parentId) : null,
          priority: priority ? Number(priority) : 1,
        },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Category updated successfully',
        success: true,
        data: category,
      })
    } catch (error) {
      next(error)
    }
  }
  async getCategoriesWithSubcategoriesAndProductCounts(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { parentId = null } = req.query
      const categories =
        await shopCategoryServices.getCategoriesWithAggregatedProductCounts(
          parentId ? Number(parentId) : null,
        )

      res.status(200).json({
        statusCode: 200,
        message:
          'Categories with subcategories and product counts retrieved successfully',
        success: true,
        data: categories,
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { categoryId } = req.params

      await shopCategoryServices.deleteCategory(userId!, Number(categoryId))

      res.status(200).json({
        statusCode: 200,
        message: 'Category deleted successfully',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }

  // ==========================================
  // SHOP-CATEGORY ASSIGNMENT
  // ==========================================

  async assignCategoryToShop(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { shopId, categoryId } = req.body

      const shopCategory = await shopCategoryServices.assignCategoryToShop(
        userId!,
        Number(shopId),
        Number(categoryId),
      )

      res.status(201).json({
        statusCode: 201,
        message: 'Category assigned to shop successfully',
        success: true,
        data: shopCategory,
      })
    } catch (error) {
      next(error)
    }
  }

  async removeCategoryFromShop(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.userId
      const { shopId, categoryId } = req.params

      await shopCategoryServices.removeCategoryFromShop(
        userId!,
        Number(shopId),
        Number(categoryId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Category removed from shop successfully',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }

  async getShopCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { shopId } = req.params
      const categories = await shopCategoryServices.getShopCategories(
        Number(shopId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Shop categories retrieved successfully',
        success: true,
        data: categories,
      })
    } catch (error) {
      next(error)
    }
  }

  async getShopsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params
      const shops = await shopCategoryServices.getShopsByCategory(
        Number(categoryId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Shops by category retrieved successfully',
        success: true,
        data: shops,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new ShopCategoryController()
