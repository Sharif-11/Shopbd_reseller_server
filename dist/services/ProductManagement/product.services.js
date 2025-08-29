"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const ftp_services_1 = require("../FtpFileUpload/ftp.services");
const axios_1 = __importDefault(require("axios"));
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
const shopCategory_services_1 = __importDefault(require("./shopCategory.services"));
class ProductServices {
    // ==========================================
    // PERMISSION CHECKS
    // ==========================================
    verifyProductPermission(userId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, action);
        });
    }
    // ==========================================
    // PRODUCT CRUD OPERATIONS
    // ==========================================
    createProduct(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.CREATE);
            // check validity of shop and category
            const shop = yield prisma_1.default.shop.findUnique({
                where: { shopId: data.shopId },
            });
            if (!shop)
                throw new ApiError_1.default(404, 'Shop not found');
            const category = yield prisma_1.default.category.findUnique({
                where: { categoryId: data.categoryId },
            });
            if (!category)
                throw new ApiError_1.default(404, 'Category not found');
            // now we need to assign the category to the shop and add product within a transaction
            const shopCategory = yield prisma_1.default.shopCategory.findFirst({
                where: {
                    shopId: data.shopId,
                    categoryId: data.categoryId,
                },
            });
            if (shopCategory) {
                return prisma_1.default.product.create({
                    data: Object.assign(Object.assign({}, data), { published: false }),
                });
            }
            else {
                // If shop-category relationship doesn't exist, create it and then create the product within a transaction
                return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const newShopCategory = yield tx.shopCategory.create({
                        data: {
                            shopId: data.shopId,
                            categoryId: data.categoryId,
                        },
                    });
                    return tx.product.create({
                        data: Object.assign(Object.assign({}, data), { published: false }),
                    });
                }));
            }
        });
    }
    updateProduct(userId, productId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.UPDATE);
            if (data.categoryId) {
                yield shopCategory_services_1.default.getCategory(data.categoryId);
            }
            return prisma_1.default.product.update({
                where: { productId },
                data,
            });
        });
    }
    togglePublishStatus(userId, productId, publish) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.UPDATE);
            if (publish === true) {
                // Check if the product has at least one visible image
                const images = yield prisma_1.default.productImage.findMany({
                    where: { productId, hidden: false },
                });
                if (images.length === 0) {
                    throw new ApiError_1.default(400, 'পাবলিশ করার জন্য পণ্যটির অন্তত একটি ছবি থাকতে হবে');
                }
            }
            return prisma_1.default.product.update({
                where: { productId },
                data: { published: publish },
            });
        });
    }
    // ==========================================
    // VARIANT MANAGEMENT
    // ==========================================
    getProductVariants(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const variants = yield prisma_1.default.productVariant.findMany({
                where: { productId },
            });
            // Group variants by name
            const groupedVariants = variants.reduce((acc, variant) => {
                if (!acc[variant.name]) {
                    acc[variant.name] = [];
                }
                acc[variant.name].push(variant.value);
                return acc;
            }, {});
            return groupedVariants;
        });
    }
    replaceVariants(userId, productId, variants) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.UPDATE);
            return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // 1. Delete all existing variants for this product
                yield tx.productVariant.deleteMany({
                    where: { productId },
                });
                // 2. Create all new variants
                if (variants.length > 0) {
                    yield tx.productVariant.createMany({
                        data: variants.map(v => (Object.assign(Object.assign({}, v), { productId }))),
                    });
                }
                // 3. Return the new count
                // return the array of created variants
                return { productId, variants };
            }));
        });
    }
    // ==========================================
    // IMAGE MANAGEMENT
    // ==========================================
    addImages(userId, productId, images) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.CREATE);
            return prisma_1.default.productImage.createMany({
                data: images.map(img => ({
                    productId,
                    imageUrl: img.url,
                    hidden: img.hidden || false,
                })),
            });
        });
    }
    /**
     * Get all images with primary image validation
     * @param productId - Product ID
     */
    getImages(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            // check if product exists
            const product = yield prisma_1.default.product.findUnique({
                where: { productId },
            });
            if (!product)
                throw new ApiError_1.default(404, 'Product not found');
            return prisma_1.default.productImage.findMany({
                where: { productId },
                orderBy: { createdAt: 'asc' }, // Default ordering by creation time
            });
        });
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
    updateImage(userId, imageId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.UPDATE);
            const image = yield prisma_1.default.productImage.findUnique({ where: { imageId } });
            if (!image)
                throw new ApiError_1.default(404, 'Image not found');
            return prisma_1.default.productImage.update({
                where: { imageId },
                data,
            });
        });
    }
    verifyOrderProducts(productsData) {
        return __awaiter(this, void 0, void 0, function* () {
            // here for each product we need to check existence of products, image visibility and whether the selling price is greater or equal to base price
            const productIds = productsData.map(p => p.id);
            const products = yield prisma_1.default.product.findMany({
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
            });
            // Check each product for validity
            for (const product of productsData) {
                const foundProduct = products.find(p => p.productId === product.id);
                if (!foundProduct) {
                    throw new ApiError_1.default(404, `Product with ID ${product.id} not found`);
                }
                // Check if the selling price is greater than or equal to base price
                if (product.sellingPrice < foundProduct.basePrice.toNumber()) {
                    throw new ApiError_1.default(400, `Selling price for product ${product.id} must be greater than or equal to base price`);
                }
                const image = foundProduct.ProductImage.some(img => img.imageId === product.imageId);
                if (!image) {
                    throw new ApiError_1.default(404, `Invalid image ID ${product.imageId} for product ${product.id}`);
                }
            }
            // now we need to re arrange the productsData compatible with the OrderProduct interface
            const orderProducts = productsData.map(product => {
                const foundProduct = products.find(p => p.productId === product.id);
                if (!foundProduct) {
                    throw new ApiError_1.default(404, `Product with ID ${product.id} not found`);
                }
                return {
                    productId: foundProduct.productId,
                    productName: foundProduct.name,
                    productImage: product.imageUrl,
                    productVariant: product.selectedVariants
                        ? JSON.stringify(product.selectedVariants)
                        : null,
                    productQuantity: product.quantity,
                    productSellingPrice: new client_1.Prisma.Decimal(product.sellingPrice),
                    productBasePrice: foundProduct.basePrice,
                    totalProductQuantity: product.quantity,
                    totalProductSellingPrice: new client_1.Prisma.Decimal(product.sellingPrice * product.quantity),
                    totalProductBasePrice: new client_1.Prisma.Decimal(foundProduct.basePrice.toNumber() * product.quantity),
                };
            });
            // order summary
            const totalProductQuantity = orderProducts.reduce((sum, product) => sum + product.totalProductQuantity, 0);
            const totalProductSellingPrice = orderProducts.reduce((sum, product) => sum.add(product.totalProductSellingPrice), new client_1.Prisma.Decimal(0));
            const totalProductBasePrice = orderProducts.reduce((sum, product) => sum.add(product.totalProductBasePrice), new client_1.Prisma.Decimal(0));
            const totalCommission = totalProductSellingPrice.sub(totalProductBasePrice);
            return {
                totalProductQuantity,
                totalProductSellingPrice,
                totalProductBasePrice,
                totalCommission,
                products: orderProducts,
            };
        });
    }
    /**
     * Delete an image with primary validation
     * @param userId - Authenticated user ID
     * @param imageId - Image ID to delete
     */
    deleteImage(userId, imageId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.DELETE);
            const image = yield prisma_1.default.productImage.findUnique({ where: { imageId } });
            if (!image)
                throw new ApiError_1.default(404, 'Image not found');
            // check if there is any OrderProduct with this image
            const existingOrderProduct = yield prisma_1.default.orderProduct.findFirst({
                where: {
                    productImage: image.imageUrl,
                },
            });
            if (existingOrderProduct) {
                throw new ApiError_1.default(400, 'There is an order with this image');
            }
            return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Extract filename from imageUrl
                const fileName = this.extractFileNameFromUrl(image.imageUrl);
                try {
                    // Delete from FTP first
                    yield ftp_services_1.ftpUploader.deleteFile(fileName);
                }
                catch (error) {
                    console.error('Failed to delete image from FTP:', error);
                    throw new ApiError_1.default(500, 'Failed to delete image from storage');
                }
                yield tx.productImage.delete({ where: { imageId } });
                return { success: true };
            }));
        });
    }
    extractFileNameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            return pathParts[pathParts.length - 1];
        }
        catch (error) {
            throw new ApiError_1.default(400, 'Invalid image URL format');
        }
    }
    /**
     * Delete all images for a product
     * @param userId - Authenticated user ID
     * @param productId - Product ID
     */
    deleteAllImages(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.DELETE);
            return prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                const images = yield tx.productImage.findMany({
                    where: { productId },
                });
                // Delete all images from FTP first
                const deletePromises = images.map((image) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const fileName = this.extractFileNameFromUrl(image.imageUrl);
                        yield ftp_services_1.ftpUploader.deleteFile(fileName);
                    }
                    catch (error) {
                        console.error(`Failed to delete image ${image.imageId} from FTP:`, error);
                        // Continue with other deletions even if one fails
                    }
                }));
                yield Promise.all(deletePromises);
                // Then delete all database records
                return tx.productImage.deleteMany({ where: { productId } });
            }));
        });
    }
    // ==========================================
    // PRODUCT SEARCH
    // ==========================================
    getProductDetailForAdmin(userId, productId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(userId, client_1.ActionType.READ);
            const product = yield prisma_1.default.product.findUnique({
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
            });
            if (!product)
                throw new ApiError_1.default(404, 'Product not found');
            // Group variants by name
            const groupedVariants = product.ProductVariant.reduce((acc, variant) => {
                if (!acc[variant.name]) {
                    acc[variant.name] = [];
                }
                acc[variant.name].push(variant.value);
                return acc;
            }, {});
            return Object.assign(Object.assign({}, product), { variants: groupedVariants, images: product.ProductImage });
        });
    }
    getProductDetailForCustomer(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield prisma_1.default.product.findFirst({
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
            });
            if (!product)
                throw new ApiError_1.default(404, 'Product not found or not published');
            // Group variants by name
            const groupedVariants = product.ProductVariant.reduce((acc, variant) => {
                if (!acc[variant.name]) {
                    acc[variant.name] = [];
                }
                acc[variant.name].push(variant.value);
                return acc;
            }, {});
            const { basePrice } = product, productData = __rest(product, ["basePrice"]);
            return {
                product: Object.assign(Object.assign({}, productData), { price: product.suggestedMaxPrice, variants: groupedVariants, images: product.ProductImage }),
            };
        });
    }
    getProductDetailForSeller(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            const product = yield prisma_1.default.product.findFirst({
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
            });
            if (!product)
                throw new ApiError_1.default(404, 'Product not found in your shop');
            // Group variants by name
            const groupedVariants = product.ProductVariant.reduce((acc, variant) => {
                if (!acc[variant.name]) {
                    acc[variant.name] = [];
                }
                acc[variant.name].push(variant.value);
                return acc;
            }, {});
            return {
                product: Object.assign(Object.assign({}, product), { variants: groupedVariants, images: product.ProductImage }),
            };
        });
    }
    getProductDetail(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, productId, }) {
            try {
                if (userId) {
                    const product = yield this.getProductDetailForSeller(productId);
                    // Seller or admin view
                    return {
                        userType: 'seller',
                        product,
                    };
                }
                else {
                    const product = yield this.getProductDetailForCustomer(productId);
                    return {
                        userType: 'customer',
                        product,
                    };
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    // ==========================================
    // PRODUCT LISTING
    // ==========================================
    getAllProductsForAdmin(adminId, filters, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyProductPermission(adminId, client_1.ActionType.READ);
            const where = {
            // Default to true if not provided
            };
            // Search filter
            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Published filter
            if (filters.shopId)
                where.shopId = filters.shopId;
            if (filters.published !== undefined) {
                where.published = filters.published;
            }
            if (filters.categoryId)
                where.categoryId = filters.categoryId;
            const [products, total] = yield Promise.all([
                prisma_1.default.product.findMany({
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
                prisma_1.default.product.count({ where }),
            ]);
            return {
                data: products,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total,
                    totalPages: Math.ceil(total / pagination.limit),
                },
            };
        });
    }
    getAllProductsForCustomer(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                published: true,
                shop: {
                    isActive: true,
                },
            };
            // Add shopId filter if provided
            if (filters.shopId) {
                where.shopId = filters.shopId;
            }
            // Search filter
            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Price range filter
            if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
                where.suggestedMaxPrice = {
                    gte: filters.minPrice !== undefined
                        ? new client_1.Prisma.Decimal(filters.minPrice)
                        : undefined,
                    lte: filters.maxPrice !== undefined
                        ? new client_1.Prisma.Decimal(filters.maxPrice)
                        : undefined,
                };
            }
            if (filters.categoryId && Array.isArray(filters.categoryId)) {
                where.categoryId = { in: filters.categoryId };
            }
            else if (filters.categoryId) {
                where.categoryId = filters.categoryId;
            }
            const products = yield prisma_1.default.product.findMany({
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
            });
            return {
                data: products.map(p => (Object.assign(Object.assign({}, p), { price: p.suggestedMaxPrice }))),
                pagination: {
                    page: 1,
                    limit: products.length,
                    total: products.length,
                    totalPages: 1,
                },
            };
        });
    }
    getAllProductsForSeller(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {
                published: true,
            };
            // Add shopId filter if provided
            if (filters.shopId) {
                where.shopId = filters.shopId;
            }
            // Add categoryId filter if provided
            if (filters.categoryId && Array.isArray(filters.categoryId)) {
                where.categoryId = { in: filters.categoryId };
            }
            else if (filters.categoryId) {
                where.categoryId = filters.categoryId;
            }
            // Search filter
            if (filters.search) {
                where.OR = [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            // Price range filter
            if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
                where.basePrice = {
                    gte: filters.minPrice !== undefined
                        ? new client_1.Prisma.Decimal(filters.minPrice)
                        : undefined,
                    lte: filters.maxPrice !== undefined
                        ? new client_1.Prisma.Decimal(filters.maxPrice)
                        : undefined,
                };
            }
            const products = yield prisma_1.default.product.findMany({
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
            });
            return {
                data: products,
                pagination: {
                    page: 1,
                    limit: products.length,
                    total: products.length,
                    totalPages: 1,
                },
            };
        });
    }
    getAllProducts(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, filters, pagination, }) {
            try {
                if (userId) {
                    const result = yield this.getAllProductsForSeller(filters);
                    return {
                        result,
                        userType: 'seller',
                    };
                }
                else {
                    const result = yield this.getAllProductsForCustomer(filters);
                    return {
                        result,
                        userType: 'customer',
                    };
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    getLatestProducts() {
        return __awaiter(this, arguments, void 0, function* (days = 30) {
            console.log('Fetching latest products...', { days });
            try {
                // More robust date calculation using timestamps
                const currentTimestamp = Date.now();
                const sinceTimestamp = currentTimestamp - days * 24 * 60 * 60 * 1000;
                const sinceDate = new Date(sinceTimestamp);
                const products = yield prisma_1.default.product.findMany({
                    where: {
                        createdAt: {
                            gte: sinceDate,
                        },
                        published: true,
                        shop: {
                            isActive: true,
                        },
                    },
                    select: {
                        productId: true,
                        name: true,
                        description: true,
                        suggestedMaxPrice: true,
                        shop: { select: { shopName: true, shopLocation: true } },
                        category: { select: { name: true } },
                        ProductImage: {
                            where: { hidden: false },
                            select: { imageUrl: true },
                            orderBy: { isPrimary: 'desc' },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 15,
                });
                return {
                    data: products.map(p => (Object.assign(Object.assign({}, p), { price: p.suggestedMaxPrice }))),
                    pagination: {
                        page: 1,
                        limit: products.length,
                        total: products.length,
                        totalPages: 1,
                    },
                };
            }
            catch (error) {
                console.error('Error in getLatestProducts:', error);
                throw error;
            }
        });
    }
    fraudChecker(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo5ODAsInVzZXJuYW1lIjoiU2hhcmlmdWwgSXNsYW0iLCJleHAiOjE3NTE4MzI5NTh9.ZcD9fdaSbBCDOM042XGTnwD1F-hcdwS3CLCCtHDAeWA';
            const url = `https://app.uddoktabd.com/api/courier?phone=${phoneNumber}`;
            // now i need to hit the fraud checker API via axios with authentication token
            try {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.clear();
                console.log('Fraud check response: ', phoneNumber, response.data);
                return response.data;
            }
            catch (error) {
                console.error('Error checking fraud:', error);
                throw error;
            }
        });
    }
}
exports.default = new ProductServices();
