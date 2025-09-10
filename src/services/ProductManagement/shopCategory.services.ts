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
    },
  ) {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.CREATE,
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

  async getAllShops(
    page = 1,
    limit = 10,
    shopName?: string,
  ): Promise<{
    shops: Shop[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit

    const where: Prisma.ShopWhereInput = {
      isActive: true,
      ...(shopName && {
        shopName: { contains: shopName, mode: 'insensitive' },
      }),
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { shopName: 'asc' },
      }),
      prisma.shop.count({ where }),
    ])

    return {
      shops,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getAllShopsForAdmin(
    userId: string,
    page = 1,
    limit = 10,
    shopName?: string,
  ): Promise<{
    shops: Shop[]
    total: number
    page: number
    totalPages: number
  }> {
    // check permissions for admin
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.READ,
    )

    const skip = (page - 1) * limit

    const where: Prisma.ShopWhereInput = {
      ...(shopName && {
        shopName: { contains: shopName, mode: 'insensitive' },
      }),
    }

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shopCategories: {
            include: {
              category: true,
            },
          },
        },
      }),
      prisma.shop.count({ where }),
    ])

    return {
      shops,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
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
    },
  ): Promise<Shop> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.UPDATE,
    )

    // Verify shop exists
    const shopExists = await prisma.shop.findUnique({ where: { shopId } })
    if (!shopExists) throw new ApiError(404, 'Shop not found')

    return prisma.shop.update({
      where: { shopId },
      data,
    })
  }
  async openOrCloseShop(
    userId: string,
    shopId: number,
    isActive: boolean,
  ): Promise<Shop> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.UPDATE,
    )

    // Verify shop exists
    const shopExists = await prisma.shop.findUnique({ where: { shopId } })
    if (!shopExists) throw new ApiError(404, 'Shop not found')

    return prisma.shop.update({
      where: { shopId },
      data: { isActive },
    })
  }
  async checkShopStatus(shopId: number) {
    const shop = await prisma.shop.findUnique({ where: { shopId } })
    if (!shop) throw new ApiError(404, 'Shop not found')
    return shop
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
      parentId?: number | null // Add parentId to creation
      priority?: number | null // Add priority to creation
    },
  ) {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.CREATE,
    )

    // Validate parent exists if provided
    if (data.parentId) {
      const parentExists = await prisma.category.count({
        where: { categoryId: data.parentId },
      })
      if (!parentExists) {
        throw new Error('Parent category not found')
      }
    }
    console.log(data)

    return prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        categoryIcon: data.categoryIcon,
        parentId: data.parentId,
        priority: data.parentId ? null : (data.priority ?? null),
      },
    })
  }

  async updateCategory(
    userId: string,
    categoryId: number,
    data: {
      name?: string
      description?: string | null
      categoryIcon?: string | null
      parentId?: number | null
      priority?: number | null
    },
  ): Promise<Category> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.UPDATE,
    )

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { categoryId },
      select: { parentId: true },
    })
    if (!category) throw new ApiError(404, 'Category not found')

    // Prevent circular references if parentId is being changed
    if (data.parentId) {
      // Can't be parent of itself
      if (data.parentId === categoryId) {
        throw new ApiError(400, 'Category cannot be a parent of itself')
      }
      // If parentId is provided, ensure it exists
      const parentExists = await prisma.category.count({
        where: { categoryId: data.parentId },
      })
      if (!parentExists) {
        throw new ApiError(404, 'Parent category not found')
      }

      // Check if new parent is a descendant (would create circular reference)
      if (
        data.parentId &&
        (await this.isDescendant(categoryId, data.parentId))
      ) {
        throw new ApiError(
          400,
          'Cannot set parent as it would create a circular reference',
        )
      }
    }

    return prisma.category.update({
      where: { categoryId },
      data: {
        name: data.name,
        description: data.description,
        categoryIcon: data.categoryIcon,
        parentId: data.parentId,
        priority: data.parentId ? null : (data.priority ?? null),
      },
    })
  }
  async getCategoriesWithAggregatedProductCounts(
    parentId: number | null = null,
  ) {
    const categories = await prisma.category.findMany({
      where: {
        parentId: parentId,
      },
      include: {
        subCategories: {
          include: {
            _count: {
              select: { Product: true },
            },
          },
        },
        _count: {
          select: { Product: true },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    })

    return categories.map(category => {
      // Calculate total products (current category + all subcategories)
      const totalProducts = category.subCategories.reduce(
        (sum, sub) => sum + sub._count.Product,
        category._count.Product, // Start with direct products count
      )

      return {
        ...category,
        products: totalProducts, // Single total count
        subCategories: category.subCategories.map(subCategory => ({
          ...subCategory,
          products: subCategory._count.Product,
          _count: undefined, // Remove original count
          priority: subCategory.priority,
        })),
        _count: undefined, // Remove original count
        priority: category.priority,
      }
    })
  }

  // Helper method to check if a category is a descendant of another
  private async isDescendant(
    parentId: number,
    potentialChildId: number,
  ): Promise<boolean> {
    let currentId = potentialChildId
    while (currentId) {
      const category = await prisma.category.findUnique({
        where: { categoryId: currentId },
        select: { parentId: true },
      })

      if (!category) return false
      if (category.parentId === parentId) return true

      currentId = category.parentId || 0
    }
    return false
  }

  async getCategory(categoryId: number): Promise<Category & { shops: Shop[] }> {
    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: {
        parentCategory: true,
        subCategories: true,
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

  async getAllCategories(
    name?: string,
    subCategories = false, // Whether to include subcategories in the result
  ): Promise<{
    categories: Category[]
    total: number
    page: number
    totalPages: number
    subCategories?: boolean // Include this in the response if needed
  }> {
    const where: Prisma.CategoryWhereInput = {
      ...(name && {
        name: { contains: name, mode: 'insensitive' },
      }),
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        include: {
          subCategories: subCategories || false,
        },
      }),
      prisma.category.count({ where }),
    ])

    return {
      categories,
      total,
      page: 1,
      totalPages: 1,
    }
  }

  async deleteCategory(
    userId: string,
    categoryId: number,
    options: {
      deleteChildren?: boolean // Whether to delete child categories
      moveChildrenToParent?: boolean // Alternative: move children to parent category
    } = {},
  ): Promise<void> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.DELETE,
    )

    // First get the category with its children
    const category = await prisma.category.findUnique({
      where: { categoryId },
      include: { subCategories: true },
    })

    if (!category) {
      throw new ApiError(404, 'Category not found')
    }

    // Check if category or any children have associated products
    if (options.deleteChildren) {
      // Check products in this category and all descendants
      const descendantIds = await this.getAllDescendantIds(categoryId)
      const allCategoryIds = [categoryId, ...descendantIds]

      const productsCount = await prisma.product.count({
        where: { categoryId: { in: allCategoryIds } },
      })

      if (productsCount > 0) {
        throw new ApiError(
          400,
          'Cannot delete category tree with associated products',
        )
      }
    } else {
      // Check only this category's products
      const productsCount = await prisma.product.count({
        where: { categoryId },
      })

      if (productsCount > 0) {
        throw new ApiError(
          400,
          'Cannot delete category with associated products',
        )
      }

      // Check if category has children
      if (category.subCategories.length > 0) {
        throw new ApiError(
          400,
          'Category has child categories. Set deleteChildren or moveChildrenToParent option',
        )
      }
    }

    return await prisma.$transaction(async tx => {
      // Handle children based on options
      if (options.deleteChildren) {
        // Delete all descendant categories
        const descendantIds = await this.getAllDescendantIds(categoryId)
        await tx.shopCategory.deleteMany({
          where: { categoryId: { in: descendantIds } },
        })
        await tx.category.deleteMany({
          where: { categoryId: { in: descendantIds } },
        })
      } else if (options.moveChildrenToParent) {
        // Move children to this category's parent
        await tx.category.updateMany({
          where: { parentId: categoryId },
          data: { parentId: category.parentId },
        })
      }

      // Delete shop category associations
      await tx.shopCategory.deleteMany({ where: { categoryId } })

      // Finally delete the category itself
      await tx.category.delete({ where: { categoryId } })
    })
  }

  // Helper method to get all descendant IDs (including nested children)
  private async getAllDescendantIds(parentId: number): Promise<number[]> {
    const descendants = await prisma.$queryRaw<{ categoryId: number }[]>`
    WITH RECURSIVE CategoryTree AS (
      SELECT categoryId FROM categories WHERE parentId = ${parentId}
      UNION ALL
      SELECT c.categoryId FROM categories c
      JOIN CategoryTree ct ON c.parentId = ct.categoryId
    )
    SELECT categoryId FROM CategoryTree
  `
    return descendants.map(d => d.categoryId)
  }
  // ==========================================
  // SHOP-CATEGORY ASSIGNMENT
  // ==========================================

  async assignCategoryToShop(
    userId: string,
    shopId: number,
    categoryId: number,
  ): Promise<ShopCategory> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.UPDATE,
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
    categoryId: number,
  ): Promise<void> {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.DELETE,
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
        'Cannot remove category with associated products in this shop',
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
