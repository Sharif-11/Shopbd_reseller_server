import { Category, Prisma, Shop, ShopCategory } from '@prisma/client'

import { ActionType, PermissionType } from '@prisma/client'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import userManagementService from '../UserManagement/user.services'

class ShopCategoryServices {
  // ==========================================
  // PERMISSION CHECKS
  // ==========================================

  // ==========================================
  // SHOP MANAGEMENT
  // ==========================================

  async createShop(
    userId: string,
    data: {
      shopName: string
      shopLocation: string
      deliveryChargeInside: Prisma.Decimal | number
      deliveryChargeOutside: Prisma.Decimal | number
      shopDescription?: string
      shopIcon?: string
    }
  ) {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.CREATE
    )
    const shop = await prisma.shop.create({
      data: {
        ...data,
        isActive: true, // Default to active
      },
    })
    return shop
  }

  async getShop(shopId: number): Promise<Shop & { categories: Category[] }> {
    const shop = await prisma.shop.findUnique({
      where: { shopId },
      include: {
        shopCategories: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!shop) throw new ApiError(404, 'Shop not found')

    return {
      ...shop,
      categories: shop.shopCategories.map(sc => sc.category),
    }
  }

  async getAllShops(): Promise<Shop[]> {
    return prisma.shop.findMany({
      where: { isActive: true },
    })
  }
  async getAllShopsForAdmin(userId: string): Promise<Shop[]> {
    // check permissions for admin
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.READ
    )

    return prisma.shop.findMany({
      include: {
        shopCategories: {
          include: {
            category: true,
          },
        },
      },
    })
  }

  async updateShop(
    userId: string,
    shopId: number,
    data: {
      shopName?: string
      shopLocation?: string
      deliveryChargeInside?: Prisma.Decimal | number
      deliveryChargeOutside?: Prisma.Decimal | number
      shopDescription?: string | null
      shopIcon?: string | null
      isActive?: boolean
    }
  ): Promise<Shop> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE
    )

    // Verify shop exists
    const shopExists = await prisma.shop.findUnique({ where: { shopId } })
    if (!shopExists) throw new ApiError(404, 'Shop not found')

    return prisma.shop.update({
      where: { shopId },
      data,
    })
  }

  // ==========================================
  // CATEGORY MANAGEMENT
  // ==========================================

  async createCategory(
    userId: string,
    data: {
      name: string
      description?: string
      categoryIcon?: string
    }
  ): Promise<Category> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.CREATE
    )

    return prisma.category.create({ data })
  }

  async getCategory(categoryId: number): Promise<Category & { shops: Shop[] }> {
    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        shopCategories: {
          include: {
            shop: true,
          },
        },
      },
    })

    if (!category) throw new ApiError(404, 'Category not found')

    return {
      ...category,
      shops: category.shopCategories.map(sc => sc.shop),
    }
  }

  async getAllCategories(): Promise<Category[]> {
    return prisma.category.findMany()
  }

  async updateCategory(
    userId: string,
    categoryId: number,
    data: {
      name?: string
      description?: string | null
      categoryIcon?: string | null
    }
  ): Promise<Category> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE
    )

    return prisma.category.update({
      where: { categoryId },
      data,
    })
  }

  async deleteCategory(userId: string, categoryId: number): Promise<void> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.DELETE
    )

    // Check if category is used in any products
    const productsCount = await prisma.product.count({
      where: { categoryId },
    })

    if (productsCount > 0) {
      throw new ApiError(400, 'Cannot delete category with associated products')
    }

    await prisma.$transaction([
      prisma.shopCategory.deleteMany({ where: { categoryId } }),
      prisma.category.delete({ where: { categoryId } }),
    ])
  }

  // ==========================================
  // SHOP-CATEGORY ASSIGNMENT
  // ==========================================

  async assignCategoryToShop(
    userId: string,
    shopId: number,
    categoryId: number
  ): Promise<ShopCategory> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.UPDATE
    )

    // Verify shop and category exist
    const [shopExists, categoryExists] = await Promise.all([
      prisma.shop.findUnique({ where: { shopId } }),
      prisma.category.findUnique({ where: { categoryId } }),
    ])

    if (!shopExists) throw new ApiError(404, 'Shop not found')
    if (!categoryExists) throw new ApiError(404, 'Category not found')

    return prisma.shopCategory.create({
      data: {
        shopId,
        categoryId,
      },
    })
  }

  async removeCategoryFromShop(
    userId: string,
    shopId: number,
    categoryId: number
  ): Promise<void> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.ORDER_MANAGEMENT,
      ActionType.DELETE
    )

    // Check if category is used in any products in this shop
    const productsCount = await prisma.product.count({
      where: {
        shopId,
        categoryId,
      },
    })

    if (productsCount > 0) {
      throw new ApiError(
        400,
        'Cannot remove category with associated products in this shop'
      )
    }

    await prisma.shopCategory.deleteMany({
      where: {
        shopId,
        categoryId,
      },
    })
  }

  async getShopCategories(shopId: number): Promise<Category[]> {
    const shop = await prisma.shop.findUnique({
      where: { shopId },
      include: {
        shopCategories: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!shop) throw new ApiError(404, 'Shop not found')

    return shop.shopCategories.map(sc => sc.category)
  }

  async getShopsByCategory(categoryId: number): Promise<Shop[]> {
    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        shopCategories: {
          include: {
            shop: true,
          },
        },
      },
    })

    if (!category) throw new ApiError(404, 'Category not found')

    return category.shopCategories.map(sc => sc.shop)
  }
}

export default new ShopCategoryServices()
