import { NextFunction, Request, Response } from 'express'
import productServices from './product.services'

class ProductController {
  // ==========================================
  // PRODUCT CRUD OPERATIONS
  // ==========================================

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const {
        shopId,
        categoryId,
        name,
        description,
        basePrice,
        suggestedMaxPrice,
        videoUrl, // Optional field for video URL
      } = req.body

      const product = await productServices.createProduct(userId!, {
        shopId: Number(shopId),
        categoryId: Number(categoryId),
        name,
        description,
        basePrice: Number(basePrice),
        suggestedMaxPrice: Number(suggestedMaxPrice),
        videoUrl,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Product created successfully',
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }

  async getProductDetailForAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      const product = await productServices.getProductDetailForAdmin(
        userId!,
        Number(productId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Product details retrieved successfully',
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      const {
        name,
        description,
        basePrice,
        suggestedMaxPrice,
        videoUrl,
        categoryId,
      } = req.body

      const product = await productServices.updateProduct(
        userId!,
        Number(productId),
        {
          ...(name && { name }),
          ...(description && { description }),
          ...(basePrice && { basePrice: Number(basePrice) }),
          ...(suggestedMaxPrice && {
            suggestedMaxPrice: Number(suggestedMaxPrice),
            ...(videoUrl && { videoUrl }),
            ...(categoryId && { categoryId: Number(categoryId) }),
          }),
        },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Product updated successfully',
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      await productServices.deleteProduct(userId!, Number(productId))

      res.status(204).json({
        statusCode: 204,
        message: 'Product deleted successfully',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }
  async archiveProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      await productServices.archiveProduct(userId!, Number(productId))

      res.status(204).json({
        statusCode: 204,
        message: 'Product archived successfully',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }
  async restoreProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      await productServices.restoreProduct(userId!, Number(productId))

      res.status(204).json({
        statusCode: 204,
        message: 'Product restored successfully',
        success: true,
      })
    } catch (error) {
      next(error)

      res.status(204).json({
        statusCode: 204,
        message: 'Product archived successfully',
        success: true,
      })
    }
  }

  async togglePublishStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params
      const { publish } = req.body

      const product = await productServices.togglePublishStatus(
        userId!,
        Number(productId),
        Boolean(publish),
      )

      res.status(200).json({
        statusCode: 200,
        message: `Product ${
          publish ? 'published' : 'unpublished'
        } successfully`,
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }

  // ==========================================
  // VARIANT MANAGEMENT
  // ==========================================

  async getProductVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params

      const variants = await productServices.getProductVariants(
        Number(productId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Product variants retrieved successfully',
        success: true,
        data: variants,
      })
    } catch (error) {
      next(error)
    }
  }

  async replaceVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params
      const { variants } = req.body

      const result = await productServices.replaceVariants(
        userId!,
        Number(productId),
        variants,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Product variants replaced successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  // ==========================================
  // IMAGE MANAGEMENT
  // ==========================================

  async addImages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params
      const { images } = req.body

      const result = await productServices.addImages(
        userId!,
        Number(productId),
        images,
      )

      res.status(201).json({
        statusCode: 201,
        message: 'Images added successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  async getImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params

      const images = await productServices.getImages(Number(productId))

      res.status(200).json({
        statusCode: 200,
        message: 'Product images retrieved successfully',
        success: true,
        data: images,
      })
    } catch (error) {
      next(error)
    }
  }

  async updateImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { imageId } = req.params
      const { isPrimary, hidden } = req.body

      const image = await productServices.updateImage(
        userId!,
        Number(imageId),
        {
          ...(isPrimary !== undefined && { isPrimary }),
          ...(hidden !== undefined && { hidden }),
        },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Image updated successfully',
        success: true,
        data: image,
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { imageId } = req.params

      await productServices.deleteImage(userId!, Number(imageId))

      res.status(200).json({
        statusCode: 200,
        message: 'Image deleted successfully',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }

  async deleteAllImages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      await productServices.deleteAllImages(userId!, Number(productId))

      res.status(200).json({
        statusCode: 200,
        message: 'All product images deleted successfully',
        success: true,
      })
    } catch (error) {
      next(error)
    }
  }

  // ==========================================
  // PRODUCT VIEWS
  // ==========================================

  async getProductDetailForCustomer(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { productId } = req.params

      const product = await productServices.getProductDetailForCustomer(
        Number(productId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Product details retrieved successfully',
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }

  async getProductDetailForSeller(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.userId
      const { productId } = req.params

      const product = await productServices.getProductDetailForSeller(
        Number(productId),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Product details retrieved successfully',
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }
  async getProductDetail(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const { productId } = req.params
    console.clear()

    const { userType, product } = await productServices.getProductDetail({
      userId,
      productId: Number(productId),
    })

    res.status(200).json({
      statusCode: 200,
      message: 'Product details retrieved successfully',
      success: true,
      data: { userType, ...product },
    })
  }

  // ==========================================
  // PRODUCT LISTING
  // ==========================================
  async getAllProductsForAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.userId
      const { search, shopId, published } = req.query
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10000

      // No need for optional checks since validation middleware ensures required fields

      const result = await productServices.getAllProductsForAdmin(
        userId!,
        {
          search: search?.toString(),
          shopId: Number(shopId),
          published:
            String(published) === 'true'
              ? true
              : String(published) === 'false'
                ? false
                : undefined,
        },
        { page, limit },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Products retrieved successfully',
        success: true,
        data: {
          products: result.data,
          pagination: result.pagination,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllProductsForCustomer(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { search, minPrice, maxPrice, categoryId } = req.query
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10

      const result = await productServices.getAllProductsForCustomer({
        search: search?.toString(),
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        categoryId: Number(categoryId),
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Products retrieved successfully',
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllProductsForSeller(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.userId
      const { search, minPrice, maxPrice, categoryId, shopId, page, limit } =
        req.query
      console.log(req.query)

      const result = await productServices.getAllProductsForSeller({
        search: search?.toString(),
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        categoryId: Number(categoryId),
        shopId: Number(shopId),
        page: !isNaN(Number(page)) ? Number(page) : undefined,
        limit: !isNaN(Number(limit)) ? Number(limit) : undefined,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Products retrieved successfully',
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }
  async getAllProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req?.user?.userId
      console.log('user', req?.user)
      const { search, minPrice, maxPrice, categoryId, shopId, page, limit } =
        req.query

      const formattedPage = !isNaN(Number(req.query.page))
        ? Number(req.query.page)
        : undefined
      const formattedLimit = !isNaN(Number(req.query.limit))
        ? Number(req.query.limit)
        : undefined
      console.log({
        search,
        minPrice,
        maxPrice,
        categoryId,
        shopId,
        page,
        limit,
        formattedPage,
        formattedLimit,
      })

      // Prepare filters with optional parameters
      const filters = {
        search: search?.toString(),
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        categoryId: categoryId
          ? Array.isArray(categoryId)
            ? categoryId.map(Number)
            : Number(categoryId)
          : undefined,
        shopId: shopId ? Number(shopId) : undefined, // Made optional
      }

      const { result, userType } = await productServices.getAllProducts({
        userId,
        filters,
        pagination: {
          page: formattedPage,
          limit: formattedLimit,
        },
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Products retrieved successfully',
        success: true,
        data: result.data,
        pagination: result.pagination,
        userType,
      })
    } catch (error) {
      next(error)
    }
  }
  async getLatestProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { days, page, limit } = req.query
      const user = req.user
      // days may be absent
      const result = await productServices.getLatestProducts(
        days ? Number(days) : 30,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
        Boolean(user),
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Latest products retrieved successfully',
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }
  async getArchivedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { search, page, limit } = req?.query
      console.log('inside archive', { search, page, limit })

      const result = await productServices.getArchiveProducts(
        userId!,
        {
          search: search?.toString(),
        },
        {
          page: page ? Number(page) : 1,
          limit: limit ? Number(limit) : 10,
        },
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Archived products retrieved successfully',
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new ProductController()
