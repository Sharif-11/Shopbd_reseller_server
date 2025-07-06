import {
  ActionType,
  PermissionType,
  Prisma,
  Product,
  ProductImage,
} from '@prisma/client'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import { ftpUploader } from '../FtpFileUpload/ftp.services'

import axios from 'axios'
import { OrderProductData } from '../Order Services/order.types'
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
      videoUrl?: string
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
      name: string
      description: string
      basePrice: Prisma.Decimal | number
      suggestedMaxPrice: Prisma.Decimal | number
      videoUrl?: string
    },
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

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
    images: { url: string; hidden?: boolean }[],
  ) {
    await this.verifyProductPermission(userId, ActionType.CREATE)

    return prisma.productImage.createMany({
      data: images.map(img => ({
        productId,
        imageUrl: img.url,
        hidden: img.hidden || false,
      })),
    })
  }

  /**
   * Get all images with primary image validation
   * @param productId - Product ID
   */
  async getImages(productId: number): Promise<ProductImage[]> {
    // check if product exists
    const product = await prisma.product.findUnique({
      where: { productId },
    })
    if (!product) throw new ApiError(404, 'Product not found')
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' }, // Default ordering by creation time
    })
  }
  /**
   * Internal method to fix primary image state
   */

  /**
   * Update image properties with primary validation
   * @param userId - Authenticated user ID
   * @param imageId - Image ID to update
   * @param data - Update data
   */
  async updateImage(
    userId: string,
    imageId: number,
    data: { hidden?: boolean },
  ) {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    const image = await prisma.productImage.findUnique({ where: { imageId } })
    if (!image) throw new ApiError(404, 'Image not found')

    return prisma.productImage.update({
      where: { imageId },
      data,
    })
  }

  async verifyOrderProducts(productsData: OrderProductData[]) {
    // here for each product we need to check existence of products, image visibility and whether the selling price is greater or equal to base price
    const productIds = productsData.map(p => p.id)
    const products = await prisma.product.findMany({
      where: {
        productId: { in: productIds },
        ProductImage: {
          some: { hidden: false }, // Ensure at least one visible image exists
        },
      },
      include: {
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true, imageId: true },
        },
      },
    })

    // Check each product for validity
    for (const product of productsData) {
      const foundProduct = products.find(p => p.productId === product.id)
      if (!foundProduct) {
        throw new ApiError(404, `Product with ID ${product.id} not found`)
      }

      // Check if the selling price is greater than or equal to base price
      if (product.sellingPrice < foundProduct.basePrice.toNumber()) {
        throw new ApiError(
          400,
          `Selling price for product ${product.id} must be greater than or equal to base price`,
        )
      }

      const image = foundProduct.ProductImage.some(
        img => img.imageId === product.imageId,
      )
      if (!image) {
        throw new ApiError(
          404,
          `Invalid image ID ${product.imageId} for product ${product.id}`,
        )
      }
    }

    // now we need to re arrange the productsData compatible with the OrderProduct interface
    const orderProducts = productsData.map(product => {
      const foundProduct = products.find(p => p.productId === product.id)
      if (!foundProduct) {
        throw new ApiError(404, `Product with ID ${product.id} not found`)
      }

      return {
        productId: foundProduct.productId,
        productName: foundProduct.name,
        productImage: product.imageUrl,
        productVariant: product.selectedVariants
          ? JSON.stringify(product.selectedVariants)
          : null,
        productQuantity: product.quantity,
        productSellingPrice: new Prisma.Decimal(product.sellingPrice),
        productBasePrice: foundProduct.basePrice,
        totalProductQuantity: product.quantity,
        totalProductSellingPrice: new Prisma.Decimal(
          product.sellingPrice * product.quantity,
        ),
        totalProductBasePrice: new Prisma.Decimal(
          foundProduct.basePrice.toNumber() * product.quantity,
        ),
      }
    })
    // order summary
    const totalProductQuantity = orderProducts.reduce(
      (sum, product) => sum + product.totalProductQuantity,
      0,
    )
    const totalProductSellingPrice = orderProducts.reduce(
      (sum, product) => sum.add(product.totalProductSellingPrice),
      new Prisma.Decimal(0),
    )
    const totalProductBasePrice = orderProducts.reduce(
      (sum, product) => sum.add(product.totalProductBasePrice),
      new Prisma.Decimal(0),
    )
    const totalCommission = totalProductSellingPrice.sub(totalProductBasePrice)

    return {
      totalProductQuantity,
      totalProductSellingPrice,
      totalProductBasePrice,
      totalCommission,
      products: orderProducts,
    }
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

      // Extract filename from imageUrl
      const fileName = this.extractFileNameFromUrl(image.imageUrl)

      try {
        // Delete from FTP first
        await ftpUploader.deleteFile(fileName)
      } catch (error) {
        console.error('Failed to delete image from FTP:', error)
        throw new ApiError(500, 'Failed to delete image from storage')
      }

      await tx.productImage.delete({ where: { imageId } })
      return { success: true }
    })
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      return pathParts[pathParts.length - 1]
    } catch (error) {
      throw new ApiError(400, 'Invalid image URL format')
    }
  }

  /**
   * Delete all images for a product
   * @param userId - Authenticated user ID
   * @param productId - Product ID
   */
  async deleteAllImages(userId: string, productId: number) {
    await this.verifyProductPermission(userId, ActionType.DELETE)

    return prisma.$transaction(async tx => {
      const images = await tx.productImage.findMany({
        where: { productId },
      })

      // Delete all images from FTP first
      const deletePromises = images.map(async image => {
        try {
          const fileName = this.extractFileNameFromUrl(image.imageUrl)
          await ftpUploader.deleteFile(fileName)
        } catch (error) {
          console.error(
            `Failed to delete image ${image.imageId} from FTP:`,
            error,
          )
          // Continue with other deletions even if one fails
        }
      })

      await Promise.all(deletePromises)

      // Then delete all database records
      return tx.productImage.deleteMany({ where: { productId } })
    })
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

  async getProductDetailForCustomer(productId: number) {
    const product = await prisma.product.findFirst({
      where: {
        productId,
        published: true,
      },
      include: {
        shop: {
          select: {
            shopName: true,
            shopLocation: true,
            deliveryChargeInside: true,
            deliveryChargeOutside: true,
          },
        },
        category: { select: { name: true } },
        ProductVariant: true,
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true, imageId: true },
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
        published: true, // Only show published products
      },
      include: {
        shop: {
          select: {
            shopName: true,
            shopLocation: true,
            deliveryChargeInside: true,
            deliveryChargeOutside: true,
          },
        },
        category: { select: { name: true } },
        ProductVariant: true,
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true, imageId: true },
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

  async getProductDetail({
    userId,
    productId,
  }: {
    userId?: string
    productId: number
  }) {
    try {
      if (userId) {
        const product = await this.getProductDetailForSeller(productId)
        // Seller or admin view
        return {
          userType: 'seller',
          product,
        }
      } else {
        const product = await this.getProductDetailForCustomer(productId)

        return {
          userType: 'customer',
          product,
        }
      }
    } catch (error) {
      throw error
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
      categoryId?: number // Optional for admin view
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
    if (filters.categoryId) where.categoryId = filters.categoryId

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
      shop: {
        isActive: true, // Only show products from active shops
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
          shop: { select: { shopName: true, shopLocation: true } },
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
            select: { imageUrl: true, imageId: true },
          },
          shop: {
            select: { shopName: true, shopLocation: true, shopId: true },
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
  async getAllProducts({
    userId,
    filters,
    pagination,
  }: {
    userId?: string
    filters: {
      search?: string
      minPrice?: number
      maxPrice?: number
      categoryId: number
      shopId: number
    }
    pagination: { page: number; limit: number }
  }) {
    try {
      if (userId) {
        const result = await this.getAllProductsForSeller(filters, pagination)
        return {
          result,
          userType: 'seller',
        }
      } else {
        const result = await this.getAllProductsForCustomer(filters, pagination)
        return {
          result,
          userType: 'customer',
        }
      }
    } catch (error) {
      throw error
    }
  }
  async fraudChecker(phoneNumber: string) {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo5ODAsInVzZXJuYW1lIjoiU2hhcmlmdWwgSXNsYW0iLCJleHAiOjE3NTE4MzI5NTh9.ZcD9fdaSbBCDOM042XGTnwD1F-hcdwS3CLCCtHDAeWA'
    const url = `https://app.uddoktabd.com/api/courier?phone=${phoneNumber}`
    // now i need to hit the fraud checker API via axios with authentication token
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.clear()
      console.log('Fraud check response: ', phoneNumber, response.data)
      return response.data
    } catch (error) {
      console.error('Error checking fraud:', error)
      throw error
    }
  }
}

export default new ProductServices()
