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
import {
  default as userManagementService,
  default as userServices,
} from '../UserManagement/user.services'
import shopCategoryServices from './shopCategory.services'

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
  /**
   * Validate selected add-ons against available add-ons
   */
  private validateAddOnFormat(addOns: string) {
    const parsedAddOns =
      typeof addOns === 'string' ? JSON.parse(addOns) : addOns
    //convert string to json
    console.log(parsedAddOns, typeof addOns)

    if (!Array.isArray(parsedAddOns)) {
      throw new ApiError(400, 'Add-ons must be an array')
    }
    for (const addOn of parsedAddOns) {
      if (
        typeof addOn.id !== 'string' ||
        typeof addOn.name !== 'string' ||
        typeof addOn.price !== 'number' ||
        (addOn.imageUrl && typeof addOn.imageUrl !== 'string')
      ) {
        return false
      }
    }
    return true
  }

  private validateSelectedAddOns(
    selectedAddOns: string,
    availableAddOns: string,
  ) {
    // Parse JSON strings

    const updatedSelectedAddOns = JSON.parse(selectedAddOns)
    const updatedAvailableAddOns = JSON.parse(availableAddOns)

    if (!this.validateAddOnFormat(selectedAddOns)) {
      throw new ApiError(400, 'Invalid add-on format')
    }
    // Define interface for add-on structure
    interface AddOn {
      id: number
      name: string
      price: number
      imageUrl?: string
    }

    // Create map with proper typing
    const availableAddOnMap: Map<number, AddOn> = new Map(
      updatedAvailableAddOns.map((addOn: AddOn) => [addOn.id, addOn]),
    )

    for (const selectedAddOn of updatedSelectedAddOns) {
      const availableAddOn = availableAddOnMap.get(selectedAddOn.id)

      if (!availableAddOn) {
        throw new ApiError(400, `Invalid add-on ID: ${selectedAddOn.id}`)
      }

      if (selectedAddOn.price !== availableAddOn.price) {
        throw new ApiError(
          400,
          `Price mismatch for add-on: ${selectedAddOn.name}`,
        )
      }

      if (selectedAddOn.quantity < 1) {
        throw new ApiError(
          400,
          `Invalid quantity for add-on: ${selectedAddOn.name}`,
        )
      }
    }
  }

  /**
   * Calculate total price of selected add-ons
   */
  private calculateTotalAddOnPrice(selectedAddOns?: string): number {
    if (!selectedAddOns || selectedAddOns.length === 0) {
      return 0
    }

    const parsedAddOns = JSON.parse(selectedAddOns)

    interface AddOnItem {
      id: number
      name: string
      price: number
      imageUrl: string
    }

    return parsedAddOns.reduce((total: number, addOn: AddOnItem) => {
      return total + addOn.price
    }, 0)
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
      addOns?: string // NEW: Accept add-ons as JSON array
    },
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.CREATE)
    if (data.addOns && !this.validateAddOnFormat(data.addOns)) {
      throw new ApiError(400, 'Invalid add-on format')
    }

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
          addOns: data.addOns || Prisma.JsonNull, // NEW: Store add-ons as JSON
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
            addOns: data.addOns || Prisma.JsonNull, // NEW: Store add-ons as JSON
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
      categoryId?: number
      addOns?: string // NEW: Allow updating add-ons
    },
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.UPDATE)
    if (data.categoryId) {
      await shopCategoryServices.getCategory(data.categoryId)
    }
    if (data.addOns && !this.validateAddOnFormat(data.addOns)) {
      throw new ApiError(400, 'Invalid add-on format')
    }
    return prisma.product.update({
      where: { productId },
      data: {
        ...data,
        addOns: data.addOns !== undefined ? data.addOns : undefined, // Only update if provided
      },
    })
  }

  async togglePublishStatus(
    userId: string,
    productId: number,
    publish: boolean,
  ): Promise<Product> {
    await this.verifyProductPermission(userId, ActionType.UPDATE)
    if (publish === true) {
      // Check if the product has at least one visible image
      const images = await prisma.productImage.findMany({
        where: { productId, hidden: false },
      })
      // if (images.length === 0) {
      //   throw new ApiError(
      //     400,
      //     'পাবলিশ করার জন্য পণ্যটির অন্তত একটি ছবি থাকতে হবে',
      //   )
      // }
    }
    return prisma.product.update({
      where: { productId },
      data: { published: publish },
    })
  }
  async deleteProduct(userId: string, productId: number) {
    await this.verifyProductPermission(userId, ActionType.DELETE)

    const product = await prisma.product.findUnique({
      where: { productId },
      include: { ProductImage: true },
    })

    if (!product) throw new ApiError(404, 'Product not found')
    // at first we need to check if there is any order associated with this product which is not completed or rejected
    const associatedOrders = await prisma.order.findMany({
      where: {
        OrderProduct: {
          some: {
            productId,
          },
        },
      },
    })
    if (associatedOrders.length > 0) {
      throw new ApiError(
        400,
        'সক্রিয় অর্ডার থাকার কারণে পণ্যটি মুছে ফেলা যাবে না',
      )
    }

    // Delete all associated images and variants
    await prisma.$transaction(async tx => {
      await tx.productImage.deleteMany({
        where: { productId },
      })
      await tx.productVariant.deleteMany({
        where: { productId },
      })
      await tx.product.delete({
        where: { productId },
      })
    })
    // now we need to delete the product image from ftp server
    if (product.ProductImage.length > 0) {
      await ftpUploader.deleteFilesWithUrls(
        product.ProductImage.map(img => img.imageUrl),
      )
    }
    return product
  }
  async archiveProduct(userId: string, productId: number) {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    return prisma.product.update({
      where: { productId },
      data: { archived: true },
    })
  }
  async restoreProduct(userId: string, productId: number) {
    await this.verifyProductPermission(userId, ActionType.UPDATE)

    return prisma.product.update({
      where: { productId },
      data: { archived: false },
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

  // AddOn management could be added here if needed
  async getProductAddOns(productId: number) {
    const product = await prisma.product.findUnique({
      where: { productId },
      select: { addOns: true },
    })
    if (!product) throw new ApiError(404, 'Product not found')
    return product.addOns
  }
  async updateProductAddOns(userId: string, productId: number, addOns: any[]) {
    await this.verifyProductPermission(userId, ActionType.UPDATE)
    if (!this.validateAddOnFormat(addOns)) {
      throw new ApiError(400, 'Invalid add-on format')
    }
    return prisma.product.update({
      where: { productId },
      data: { addOns: addOns.length > 0 ? addOns : Prisma.JsonNull },
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
    const productIds = productsData.map(p => p.id)
    const products = await prisma.product.findMany({
      where: {
        productId: { in: productIds },
        ProductImage: {
          some: { hidden: false },
        },
        archived: false,
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

      // Validate selected add-ons against product's available add-ons
      if (product.selectedAddOns) {
        const availableAddOns = Array.isArray(foundProduct.addOns)
          ? foundProduct.addOns
          : []

        if (availableAddOns.length > 0) {
          this.validateSelectedAddOns(
            product.selectedAddOns,
            JSON.stringify(availableAddOns),
          )
        } else if (product.selectedAddOns.length > 0) {
          throw new ApiError(
            400,
            `Product ${product.id} does not have add-ons available`,
          )
        }
      }

      // CORRECTED: Calculate base product portion (sellingPrice minus add-ons)
      const totalAddOnPrice = this.calculateTotalAddOnPrice(
        product.selectedAddOns,
      )
      const baseProductPrice = product.sellingPrice - totalAddOnPrice

      // CORRECTED: Validate that base product portion meets minimum requirement
      if (baseProductPrice < foundProduct.basePrice.toNumber()) {
        throw new ApiError(
          400,
          `Base product price (${baseProductPrice}) for "${foundProduct.name}" must be ≥ ${foundProduct.basePrice.toNumber()} (after deducting add-ons)`,
        )
      }

      const imageExists = foundProduct.ProductImage.some(
        img => img.imageId === product.imageId,
      )
      if (!imageExists) {
        throw new ApiError(
          404,
          `Invalid image ID ${product.imageId} for product ${product.id}`,
        )
      }
    }

    // Transform productsData to orderProducts format
    const orderProducts = productsData.map(product => {
      const foundProduct = products.find(p => p.productId === product.id)
      if (!foundProduct) {
        throw new ApiError(404, `Product with ID ${product.id} not found`)
      }

      const totalAddOnPrice = this.calculateTotalAddOnPrice(
        product.selectedAddOns,
      )
      const baseProductPrice = product.sellingPrice - totalAddOnPrice

      return {
        productId: foundProduct.productId,
        productName: foundProduct.name,
        productImage: product.imageUrl,
        productVariant: product.selectedVariants
          ? JSON.stringify(product.selectedVariants)
          : null,
        // Add-on fields
        selectedAddOns: product.selectedAddOns || null,
        totalAddOnPrice: new Prisma.Decimal(totalAddOnPrice),
        // CORRECTED: finalProductPrice should be the sellingPrice (which includes add-ons)
        finalProductPrice: new Prisma.Decimal(product.sellingPrice),

        productQuantity: product.quantity,
        // CORRECTED: productSellingPrice should be base product portion only
        productSellingPrice: new Prisma.Decimal(baseProductPrice),
        productBasePrice: foundProduct.basePrice,
        totalProductQuantity: product.quantity,
        totalProductSellingPrice: new Prisma.Decimal(
          baseProductPrice * product.quantity,
        ),
        totalProductBasePrice: new Prisma.Decimal(
          foundProduct.basePrice.toNumber() * product.quantity,
        ),
      }
    })

    // Calculate order summary
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
    const totalAddOnPrice = orderProducts.reduce(
      (sum, product) => sum.add(product.totalAddOnPrice),
      new Prisma.Decimal(0),
    )
    const totalCommission = totalProductSellingPrice.sub(totalProductBasePrice)
    // CORRECTED: finalOrderTotal should be totalProductSellingPrice + totalAddOnPrice
    const finalOrderTotal = totalProductSellingPrice.add(totalAddOnPrice)

    return {
      totalProductQuantity,
      totalProductSellingPrice,
      totalProductBasePrice,
      totalAddOnPrice,
      totalCommission,
      finalOrderTotal,
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
    const image = await prisma.productImage.findUnique({ where: { imageId } })
    if (!image) throw new ApiError(404, 'Image not found')
    // check if there is any OrderProduct with this image
    const existingOrderProduct = await prisma.orderProduct.findFirst({
      where: {
        productImage: image.imageUrl,
      },
    })
    if (existingOrderProduct) {
      throw new ApiError(400, 'There is an order with this image')
    }

    return prisma.$transaction(async tx => {
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
      where: { productId, archived: false },
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
        archived: false,
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
        archived: false,
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
      console.clear()
      console.log('Get product detail called with:', { userId, productId })
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
      archived: false,
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
          category: { select: { name: true, categoryId: true } },
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
      // here converts addOns string to object
      data: products.map(product => ({
        ...product,
        addOns: product.addOns
          ? typeof product.addOns === 'string'
            ? JSON.parse(product.addOns)
            : product.addOns
          : [],
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    }
  }

  async getAllProductsForCustomer(filters: {
    search?: string
    minPrice?: number
    maxPrice?: number
    categoryId?: number | number[]
    shopId?: number // Made optional
    page?: number
    limit?: number
  }) {
    const where: Prisma.ProductWhereInput = {
      published: true,
      archived: false,
      shop: {
        isActive: true,
      },
    }

    // Add shopId filter if provided
    if (filters.shopId) {
      where.shopId = filters.shopId
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

    if (filters.categoryId && Array.isArray(filters.categoryId)) {
      where.categoryId = { in: filters.categoryId }
    } else if (filters.categoryId) {
      where.categoryId = filters.categoryId
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        productId: true,
        name: true,
        description: true,
        suggestedMaxPrice: true,
        shop: { select: { shopName: true, shopLocation: true } },
        category: { select: { name: true, categoryId: true } },
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true },
          orderBy: { isPrimary: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: filters.page
        ? (filters.page - 1) * (filters.limit || 10)
        : undefined,
      take: filters.limit || undefined,
    })
    const productCount = await prisma.product.count({
      where,
    })

    return {
      data: products.map(p => ({
        ...p,
        price: p.suggestedMaxPrice,
      })),
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: productCount,
        totalPages: Math.ceil(productCount / (filters.limit || 10)),
      },
    }
  }

  async getAllProductsForSeller(filters: {
    search?: string
    minPrice?: number
    maxPrice?: number
    categoryId?: number | number[]
    shopId?: number // Made optional
    page?: number
    limit?: number
  }) {
    console.log(filters)
    const where: Prisma.ProductWhereInput = {
      published: true,
      archived: false,
    }

    // Add shopId filter if provided
    if (filters.shopId) {
      where.shopId = filters.shopId
    }

    // Add categoryId filter if provided
    if (filters.categoryId && Array.isArray(filters.categoryId)) {
      where.categoryId = { in: filters.categoryId }
    } else if (filters.categoryId) {
      where.categoryId = filters.categoryId
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

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, categoryId: true } },
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true, imageId: true },
        },
        shop: {
          select: { shopName: true, shopLocation: true, shopId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: filters.page
        ? (filters.page - 1) * (filters.limit || 10)
        : undefined,
      take: filters.limit || undefined,
    })
    const total = await prisma.product.count({
      where,
    })

    return {
      data: products,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        totalPages: Math.ceil(total / (filters.limit || 10)),
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
      categoryId?: number | number[] // Made optional to match the other functions
      shopId?: number // Made optional
    }
    pagination: { page?: number; limit?: number }
  }) {
    try {
      console.log(userId, filters, pagination)
      if (userId) {
        const result = await this.getAllProductsForSeller({
          ...filters,
          ...pagination,
        })
        return {
          result,
          userType: 'seller',
        }
      } else {
        const result = await this.getAllProductsForCustomer({
          ...filters,
          ...pagination,
        })
        return {
          result,
          userType: 'customer',
        }
      }
    } catch (error) {
      throw error
    }
  }
  async getLatestProducts(
    days: number = 30,
    page = 1,
    limit = 10,
    isSeller: boolean = false,
  ) {
    try {
      // More robust date calculation using timestamps
      const currentTimestamp = Date.now()
      const sinceTimestamp = currentTimestamp - days * 24 * 60 * 60 * 1000
      const sinceDate = new Date(sinceTimestamp)

      const products = await prisma.product.findMany({
        where: {
          createdAt: {
            gte: sinceDate,
          },
          published: true,
          archived: false,
          shop: {
            isActive: true,
          },
        },
        select: {
          productId: true,
          name: true,
          description: true,
          suggestedMaxPrice: true,
          basePrice: true,
          shop: { select: { shopName: true, shopLocation: true } },
          category: { select: { name: true } },
          ProductImage: {
            where: { hidden: false },
            select: { imageUrl: true },
            orderBy: { isPrimary: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
      const productCount = await prisma.product.count({
        where: {
          createdAt: {
            gte: sinceDate,
          },
          published: true,
          archived: false,
          shop: {
            isActive: true,
          },
        },
      })

      return {
        data: products.map(p => ({
          ...p,
          price: isSeller ? p.basePrice : p.suggestedMaxPrice,
        })),
        pagination: {
          page,
          limit,
          total: productCount,
          totalPages: Math.ceil(productCount / limit),
        },
      }
    } catch (error) {
      console.error('Error in getLatestProducts:', error)
      throw error
    }
  }
  async getArchiveProducts(
    userId?: string,
    filters?: {
      search?: string
    },
    pagination?: { page: number; limit: number },
  ) {
    await userServices.verifyUserPermission(
      userId!,
      PermissionType.PRODUCT_MANAGEMENT,
      ActionType.READ,
    )
    // Fetch archived products
    const products = await prisma.product.findMany({
      where: {
        archived: true,
        // here search may be empty string we need to ignore this
        ...(filters?.search &&
          filters.search.trim().length > 0 && {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          }),
      },
      include: {
        category: { select: { name: true, categoryId: true } },
        ProductImage: {
          where: { hidden: false },
          select: { imageUrl: true, imageId: true },
        },
        shop: {
          select: { shopName: true, shopLocation: true, shopId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination ? (pagination.page - 1) * pagination.limit : 0,
      take: pagination ? pagination.limit : undefined,
    })
    const productCount = await prisma.product.count({
      where: {
        archived: true,
        // here search may be empty string we need to ignore this
        ...(filters?.search &&
          filters.search.trim().length > 0 && {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          }),
      },
    })

    return {
      data: products,
      pagination: {
        page: pagination ? pagination.page : 1,
        limit: pagination ? pagination.limit : productCount,
        total: productCount,
        totalPages: pagination ? Math.ceil(productCount / pagination.limit) : 1,
      },
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
