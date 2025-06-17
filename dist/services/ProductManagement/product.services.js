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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const basic_ftp_1 = __importDefault(require("basic-ftp"));
const stream_1 = require("stream");
const util_1 = require("util");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const featureExtractor_1 = require("../../utils/featureExtractor"); // Your image feature extraction utility
const prisma_1 = __importDefault(require("../../utils/prisma"));
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
class ProductServices {
    constructor() {
        this.ftpClient = new basic_ftp_1.default.Client();
        this.ftpClient.ftp.verbose = config_1.default.ftp.debug;
    }
    // ==========================================
    // PRODUCT CRUD OPERATIONS
    // ==========================================
    createProduct(productData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate shop and category exist
            const [shopExists, categoryExists] = yield Promise.all([
                prisma_1.default.shop.findUnique({ where: { shopId: productData.shopId } }),
                prisma_1.default.category.findUnique({
                    where: { categoryId: productData.categoryId },
                }),
            ]);
            if (!shopExists) {
                throw new ApiError_1.default(404, 'Shop not found');
            }
            if (!categoryExists) {
                throw new ApiError_1.default(404, 'Category not found');
            }
            return prisma_1.default.product.create({
                data: {
                    shopId: productData.shopId,
                    categoryId: productData.categoryId,
                    name: productData.name,
                    description: productData.description,
                    basePrice: productData.basePrice,
                    suggestedMaxPrice: productData.suggestedMaxPrice,
                    videoUrl: productData.videoUrl,
                },
            });
        });
    }
    updateProduct(productId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (updateData.categoryId) {
                const categoryExists = yield prisma_1.default.category.findUnique({
                    where: { categoryId: updateData.categoryId },
                });
                if (!categoryExists) {
                    throw new ApiError_1.default(404, 'Category not found');
                }
            }
            return prisma_1.default.product.update({
                where: { productId },
                data: updateData,
            });
        });
    }
    toggleProductPublishStatus(productId, publish) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.product.update({
                where: { productId },
                data: { published: publish },
            });
        });
    }
    // ==========================================
    // PRODUCT IMAGE MANAGEMENT
    // ==========================================
    // ==========================================
    // CATEGORY MANAGEMENT
    // ==========================================
    createCategory(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.category.create({ data });
        });
    }
    updateCategory(categoryId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.category.update({
                where: { categoryId },
                data,
            });
        });
    }
    getCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.category.findUnique({ where: { categoryId } });
        });
    }
    getAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.category.findMany();
        });
    }
    // ==========================================
    // SHOP MANAGEMENT
    // ==========================================
    createShop(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.shop.create({ data });
        });
    }
    updateShop(shopId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.shop.update({
                where: { shopId },
                data,
            });
        });
    }
    getShop(shopId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.shop.findUnique({ where: { shopId } });
        });
    }
    getAllShops() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.shop.findMany();
        });
    }
    toggleShopStatus(shopId, isActive) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.shop.update({
                where: { shopId },
                data: { isActive },
            });
        });
    }
    // ==========================================
    // RELATIONAL QUERIES
    // ==========================================
    getShopCategories(shopId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get unique categories that have products in this shop
            return prisma_1.default.$queryRaw `
      SELECT DISTINCT c.* 
      FROM categories c
      JOIN products p ON c.category_id = p.category_id
      WHERE p.shop_id = ${shopId}
    `;
        });
    }
    getShopProductsByCategory(shopId_1, categoryId_1) {
        return __awaiter(this, arguments, void 0, function* (shopId, categoryId, options = {}) {
            const { publishedOnly = true, page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;
            const where = Object.assign({ shopId,
                categoryId }, (publishedOnly ? { published: true } : {}));
            const [products, total] = yield Promise.all([
                prisma_1.default.product.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        ProductImage: {
                            where: { isPrimary: true, hidden: false },
                            take: 1,
                        },
                    },
                }),
                prisma_1.default.product.count({ where }),
            ]);
            return { products, total };
        });
    }
    // ==========================================
    // PRODUCT DETAIL VIEWS
    // ==========================================
    getProductForCustomer(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.product.findUnique({
                where: { productId, published: true },
                include: {
                    category: true,
                    shop: true,
                    ProductImage: {
                        where: { hidden: false },
                        orderBy: { isPrimary: 'desc' },
                    },
                    ProductVariant: true,
                },
            });
        });
    }
    getProductForSeller(productId, sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // First verify the product belongs to a shop owned by this seller
            const product = yield prisma_1.default.product.findUnique({
                where: { productId },
                include: {
                    shop: {
                        include: {
                            user: true, // Assuming you have a relation between Shop and User
                        },
                    },
                },
            });
            if (!product) {
                throw new ApiError_1.default(404, 'Product not found');
            }
            if (product.shop.user.userId !== sellerId) {
                throw new ApiError_1.default(403, 'You do not have permission to view this product');
            }
            return prisma_1.default.product.findUnique({
                where: { productId },
                include: {
                    category: true,
                    shop: true,
                    ProductImage: true,
                    ProductVariant: true,
                },
            });
        });
    }
    // ==========================================
    // SEARCH FUNCTIONALITY
    // ==========================================
    searchProducts(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { query, categoryId, minPrice, maxPrice, shopId, page = 1, limit = 10, } = filters;
            const skip = (page - 1) * limit;
            const where = Object.assign(Object.assign(Object.assign(Object.assign({ published: true }, (query
                ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                }
                : {})), (categoryId ? { categoryId } : {})), (minPrice !== undefined || maxPrice !== undefined
                ? {
                    basePrice: Object.assign(Object.assign({}, (minPrice !== undefined ? { gte: minPrice } : {})), (maxPrice !== undefined ? { lte: maxPrice } : {})),
                }
                : {})), (shopId ? { shopId } : {}));
            const [products, total] = yield Promise.all([
                prisma_1.default.product.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        category: true,
                        shop: true,
                        ProductImage: {
                            where: { isPrimary: true, hidden: false },
                            take: 1,
                        },
                    },
                }),
                prisma_1.default.product.count({ where }),
            ]);
            return { products, total };
        });
    }
    searchByImage(imageStream_1) {
        return __awaiter(this, arguments, void 0, function* (imageStream, options = {}) {
            const { threshold = 0.8, limit = 10, shopId } = options;
            // Extract features from the query image
            const featureExtractor = new featureExtractor_1.FeatureExtractor();
            const queryFeatures = yield featureExtractor.extractFeaturesFromStream(imageStream);
            // Build the where clause
            const where = Object.assign({ published: true }, (shopId ? { shopId } : {}));
            // Perform vector similarity search
            const results = yield prisma_1.default.$queryRaw `
      SELECT p.*, 
            1 - (pi.feature_vector <-> ${JSON.stringify(queryFeatures)}::jsonb) as similarity
      FROM products p
      JOIN product_images pi ON p.product_id = pi.product_id
      WHERE ${client_1.Prisma.sql(client_1.Prisma.raw(client_1.Prisma.sql `${where} AND 1 - (pi.feature_vector <-> ${JSON.stringify(queryFeatures)}::jsonb) > ${threshold}`))}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
            return results;
        });
    }
    // ==========================================
    // PRODUCT VARIANT MANAGEMENT
    // ==========================================
    createProductVariant(productId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if product exists
            const productExists = yield prisma_1.default.product.findUnique({
                where: { productId },
            });
            if (!productExists) {
                throw new ApiError_1.default(404, 'Product not found');
            }
            // Check if variant already exists
            const existingVariant = yield prisma_1.default.productVariant.findFirst({
                where: {
                    productId,
                    name: data.name,
                    value: data.value,
                },
            });
            if (existingVariant) {
                throw new ApiError_1.default(400, 'Variant already exists');
            }
            return prisma_1.default.productVariant.create({
                data: {
                    productId,
                    name: data.name,
                    value: data.value,
                },
            });
        });
    }
    updateProductVariant(variantId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.productVariant.update({
                where: { variantId },
                data,
            });
        });
    }
    getProductVariants(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.productVariant.findMany({
                where: { productId },
            });
        });
    }
    deleteProductVariant(variantId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prisma_1.default.productVariant.delete({
                where: { variantId },
            });
        });
    }
}
exports.default = new ProductServices();
