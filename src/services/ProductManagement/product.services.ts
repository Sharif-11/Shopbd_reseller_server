import {
  ActionType,
  PermissionType,
  Prisma,
  Product,
  ProductImage,
} from '@prisma/client'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import userManagementService from '../UserManagement/user.services'

class ProductServices {
  // ==========================================
  // PERMISSION CHECKS
  // ==========================================

  private async verifyProductPermission(userId: string, action: ActionType) {
    await userManagementService.verifyUserPermission(
      userId,
      PermissionType.PRODUCT_MANAGEMENT,
      action,
    )
  }

  // ==========================================
  // PRODUCT CRUD OPERATIONS
  // ==========================================

  async createProduct(
    userId: string,
    data: {
      shopId: number
      categoryId: number
      name: string
      description: string
      basePrice: Prisma.Decimal | number
      suggestedMaxPrice: Prisma.Decimal | number
    },
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.CREATE)

    // check validity of shop and category

    const shop = await prisma.shop.findUnique({
      where: { shopId: data.shopId },
    })
    if (!shop) throw new ApiError(404, 'Shop not found')
    const category = await prisma.category.findUnique({
      where: { categoryId: data.categoryId },
    })
    if (!category) throw new ApiError(404, 'Category not found')
    // now we need to assign the category to the shop and add product within a transaction
    const shopCategory = await prisma.shopCategory.findFirst({
      where: {
        shopId: data.shopId,
        categoryId: data.categoryId,
      },
    })
    if (shopCategory) {
      return prisma.product.create({
        data: {
          ...data,
          published: false, // Default to unpublished
        },
      })
    } else {
      // If shop-category relationship doesn't exist, create it and then create the product within a transaction
      return prisma.$transaction(async tx => {
        const newShopCategory = await tx.shopCategory.create({
          data: {
            shopId: data.shopId,
            categoryId: data.categoryId,
          },
        })
        return tx.product.create({
          data: {
            ...data,
            published: false, // Default to unpublished
          },
        })
      })
    }
  }

  async updateProduct(
    userId: string,
    productId: number,
    data: {
      shopId: number
      categoryId: number
      name: string
      description: string
      basePrice: Prisma.Decimal | number
      suggestedMaxPrice: Prisma.Decimal | number
    },
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    // ensure that shopid and category id combination is valid
    const shopCategory = await prisma.shopCategory.findFirst({
      where: {
        shopId: data.shopId,
        categoryId: data.categoryId,
      },
    })
    if (!shopCategory) throw new ApiError(400, 'Invalid shop or category')

    return prisma.product.update({
      where: { productId },
      data,
    })
  }

  async togglePublishStatus(
    userId: string,
    productId: number,
    publish: boolean,
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    return prisma.product.update({
      where: { productId },
      data: { published: publish },
    })
  }

  // ==========================================
  // VARIANT MANAGEMENT
  // ==========================================

  async getProductVariants(
    productId: number,
  ): Promise<{ [key: string]: string[] }> {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
    })

    // Group variants by name
    const groupedVariants = variants.reduce(
      (acc, variant) => {
        if (!acc[variant.name]) {
          acc[variant.name] = []
        }
        acc[variant.name].push(variant.value)
        return acc
      },
      {} as { [key: string]: string[] },
    )

    return groupedVariants
  }

  async replaceVariants(
    userId: string,
    productId: number,
    variants: { name: string; value: string }[],
  ) {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    return prisma.$transaction(async tx => {
      // 1. Delete all existing variants for this product
      await tx.productVariant.deleteMany({
        where: { productId },
      })

      // 2. Create all new variants
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map(v => ({ ...v, productId })),
        })
      }

      // 3. Return the new count
      // return the array of created variants
      return { productId, variants }
    })
  }

  // ==========================================
  // IMAGE MANAGEMENT
  // ==========================================

  async addImages(
    userId: string,
    productId: number,
    images: { url: string; isPrimary?: boolean; hidden?: boolean }[],
  ) {
    await this.verifyProductPermission(userId, ActionType.CREATE)

    // Validation: Must have exactly one primary if adding images
    const primaryCount = images.filter(img => img.isPrimary).length
    if (images.length > 0 && primaryCount !== 1) {
      throw new ApiError(400, 'Exactly one image must be marked as primary')
    }

    return prisma.$transaction(async tx => {
      // Reset existing primary if needed
      if (primaryCount > 0) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        })
      }

      return tx.productImage.createMany({
        data: images.map(img => ({
          productId,
          imageUrl: img.url,
          isPrimary: img.isPrimary || false,
          hidden: img.hidden || false,
        })),
      })
    })
  }

  /**
   * Get all images with primary image validation
   * @param productId - Product ID
   */
  async getImages(productId: number): Promise<ProductImage[]> {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { isPrimary: 'desc' },
    })

    // Validation: Ensure exactly one primary exists if there are images
    if (images.length > 0) {
      const primaryCount = images.filter(img => img.isPrimary).length
      if (primaryCount !== 1) {
        await this.fixPrimaryImage(productId)
        return this.getImages(productId) // Recursive call after fix
      }
    }

    return images
  }

  /**
   * Internal method to fix primary image state
   */
  private async fixPrimaryImage(productId: number) {
    await prisma.$transaction(async tx => {
      const images = await tx.productImage.findMany({
        where: { productId },
      })

      if (images.length === 0) return

      const primaryCount = images.filter(img => img.isPrimary).length

      // Case 1: No primary - set the first image as primary
      if (primaryCount === 0) {
        await tx.productImage.update({
          where: { imageId: images[0].imageId },
          data: { isPrimary: true },
        })
      }
      // Case 2: Multiple primaries - keep the newest one
      else if (primaryCount > 1) {
        const primaryImages = images.filter(img => img.isPrimary)
        const newestPrimary = primaryImages.reduce((prev, current) =>
          prev.createdAt > current.createdAt ? prev : current,
        )

        await tx.productImage.updateMany({
          where: {
            productId,
            imageId: { not: newestPrimary.imageId },
            isPrimary: true,
          },
          data: { isPrimary: false },
        })
      }
    })
  }

  /**
   * Update image properties with primary validation
   * @param userId - Authenticated user ID
   * @param imageId - Image ID to update
   * @param data - Update data
   */
  async updateImage(
    userId: string,
    imageId: number,
    data: { isPrimary?: boolean; hidden?: boolean },
  ) {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    return prisma.$transaction(async tx => {
      const image = await tx.productImage.findUnique({ where: { imageId } })
      if (!image) throw new ApiError(404, 'Image not found')

      // Handle primary image changes
      if (data.isPrimary) {
        await tx.productImage.updateMany({
          where: {
            productId: image.productId,
            isPrimary: true,
          },
          data: { isPrimary: false },
        })
      }
      // Prevent unsetting primary if it's the only image
      else if (image.isPrimary && data.isPrimary === false) {
        const otherImages = await tx.productImage.count({
          where: {
            productId: image.productId,
            imageId: { not: imageId },
          },
        })
        if (otherImages === 0) {
          throw new ApiError(
            400,
            'Cannot unset primary - product must have at least one primary image',
          )
        }
      }

      return tx.productImage.update({
        where: { imageId },
        data,
      })
    })
  }

  /**
   * Delete an image with primary validation
   * @param userId - Authenticated user ID
   * @param imageId - Image ID to delete
   */
  async deleteImage(userId: string, imageId: number) {
    await this.verifyProductPermission(userId, ActionType.DELETE)

    return prisma.$transaction(async tx => {
      const image = await tx.productImage.findUnique({ where: { imageId } })
      if (!image) throw new ApiError(404, 'Image not found')

      const isPrimary = image.isPrimary
      await tx.productImage.delete({ where: { imageId } })

      // If deleted image was primary, set a new primary
      if (isPrimary) {
        const remainingImages = await tx.productImage.findMany({
          where: { productId: image.productId },
          orderBy: { createdAt: 'asc' },
        })

        if (remainingImages.length > 0) {
          await tx.productImage.update({
            where: { imageId: remainingImages[0].imageId },
            data: { isPrimary: true },
          })
        }
      }

      return { success: true }
    })
  }

  /**
   * Delete all images for a product
   * @param userId - Authenticated user ID
   * @param productId - Product ID
   */
  async deleteAllImages(userId: string, productId: number) {
    await this.verifyProductPermission(userId, ActionType.DELETE)
    return prisma.productImage.deleteMany({ where: { productId } })
  }

  // ==========================================
  // PRODUCT SEARCH
  // ==========================================
  async getProductDetailForAdmin(
    userId: string,
    productId: number,
  ): Promise<
    Product & {
      shop: { shopName: string }
      category: { name: string }
      variants: Record<string, string[]> // Changed to grouped variants
      images: { imageUrl: string; isPrimary: boolean }[]
    }
  > {
    await this.verifyProductPermission(userId, ActionType.READ)

    const product = await prisma.product.findUnique({
      where: { productId },
      include: {
        shop: { select: { shopName: true } },
        category: { select: { name: true } },
        ProductVariant: true,
        ProductImage: {
          select: { imageUrl: true, isPrimary: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })

    if (!product) throw new ApiError(404, 'Product not found')

    // Group variants by name
    const groupedVariants = product.ProductVariant.reduce(
      (acc, variant) => {
        if (!acc[variant.name]) {
          acc[variant.name] = []
        }
        acc[variant.name].push(variant.value)
        return acc
      },
      {} as Record<string, string[]>,
    )

    return {
      ...product,
      variants: groupedVariants,
      images: product.ProductImage,
    }
  }

  async getProductDetailForCustomer(productId: number): Promise<{
    product: Omit<Product, 'basePrice' | 'published'> & {
      price: Prisma.Decimal
      shop: { shopName: string }
      category: { name: string }
      variants: Record<string, string[]> // Changed to grouped variants
      images: { imageUrl: string }[]
    }
  }> {
    const product = await prisma.product.findFirst({
      where: {
        productId,
        published: true,
        ProductImage: {
          none: { hidden: true },
        },
      },
      include: {
        shop: { select: { shopName: true } },
        category: { select: { name: true } },
        ProductVariant: true,
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })

    if (!product) throw new ApiError(404, 'Product not found or not published')

    // Group variants by name
    const groupedVariants = product.ProductVariant.reduce(
      (acc, variant) => {
        if (!acc[variant.name]) {
          acc[variant.name] = []
        }
        acc[variant.name].push(variant.value)
        return acc
      },
      {} as Record<string, string[]>,
    )

    const { basePrice, ...productData } = product
    return {
      product: {
        ...productData,
        price: product.suggestedMaxPrice,
        variants: groupedVariants,
        images: product.ProductImage,
      },
    }
  }

  async getProductDetailForSeller(productId: number): Promise<{
    product: Product & {
      shop: { shopName: string }
      category: { name: string }
      variants: Record<string, string[]> // Changed to grouped variants
      images: { imageUrl: string }[]
    }
  }> {
    const product = await prisma.product.findFirst({
      where: {
        productId,

        ProductImage: {
          none: { hidden: true },
        },
      },
      include: {
        shop: { select: { shopName: true } },
        category: { select: { name: true } },
        ProductVariant: true,
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true },
          orderBy: { isPrimary: 'desc' },
        },
      },
    })

    if (!product) throw new ApiError(404, 'Product not found in your shop')

    // Group variants by name
    const groupedVariants = product.ProductVariant.reduce(
      (acc, variant) => {
        if (!acc[variant.name]) {
          acc[variant.name] = []
        }
        acc[variant.name].push(variant.value)
        return acc
      },
      {} as Record<string, string[]>,
    )

    return {
      product: {
        ...product,
        variants: groupedVariants,
        images: product.ProductImage,
      },
    }
  }

  // ==========================================
  // PRODUCT LISTING
  // ==========================================

  async getAllProductsForAdmin(
    adminId: string,
    filters: {
      search?: string
      shopId?: number // Now optional
      published?: boolean
    },
    pagination: { page: number; limit: number },
  ) {
    await this.verifyProductPermission(adminId, ActionType.READ)
    const where: Prisma.ProductWhereInput = {
      // Default to true if not provided
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Published filter

    if (filters.shopId) where.shopId = filters.shopId
    if (filters.published !== undefined) {
      where.published = filters.published
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          shop: {
            select: { shopName: true, shopLocation: true, shopId: true },
          },
          category: { select: { name: true } },
          ProductImage: {
            where: { hidden: false },
            select: { imageUrl: true },
            orderBy: { isPrimary: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    }
  }

  async getAllProductsForCustomer(
    filters: {
      search?: string
      minPrice?: number
      maxPrice?: number
      categoryId: number
    },
    pagination: { page: number; limit: number },
  ) {
    const where: Prisma.ProductWhereInput = {
      published: true,
      ProductImage: {
        none: { hidden: true },
      },
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Price range filter (using suggestedMaxPrice for customers)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.suggestedMaxPrice = {
        gte:
          filters.minPrice !== undefined
            ? new Prisma.Decimal(filters.minPrice)
            : undefined,
        lte:
          filters.maxPrice !== undefined
            ? new Prisma.Decimal(filters.maxPrice)
            : undefined,
      }
    }

    if (filters.categoryId) where.categoryId = filters.categoryId

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        select: {
          productId: true,
          name: true,
          description: true,
          suggestedMaxPrice: true, // Only show suggested price to customers
          shop: { select: { shopName: true } },
          category: { select: { name: true } },
          ProductImage: {
            where: { hidden: false },
            select: { imageUrl: true },
            orderBy: { isPrimary: 'desc' },
            take: 1, // Just get primary image for listing
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products.map(p => ({
        ...p,
        price: p.suggestedMaxPrice, // Rename for customer view
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    }
  }

  async getAllProductsForSeller(
    filters: {
      search?: string
      minPrice?: number
      maxPrice?: number
      categoryId: number
      shopId: number
    },
    pagination: { page: number; limit: number },
  ) {
    const where: Prisma.ProductWhereInput = {
      published: true,
      shopId: filters.shopId, // Filter by seller's shop
      categoryId: filters.categoryId,
      ProductImage: {
        none: { hidden: true },
      },
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {
        gte:
          filters.minPrice !== undefined
            ? new Prisma.Decimal(filters.minPrice)
            : undefined,
        lte:
          filters.maxPrice !== undefined
            ? new Prisma.Decimal(filters.maxPrice)
            : undefined,
      }
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          category: { select: { name: true } },
          ProductImage: {
            where: { hidden: false },
            select: { imageUrl: true },
            orderBy: { isPrimary: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / pagination.limit),
      },
    }
  }
}

export default new ProductServices()
