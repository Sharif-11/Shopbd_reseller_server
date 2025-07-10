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
const product_services_1 = __importDefault(require("./product.services"));
class ProductController {
    // ==========================================
    // PRODUCT CRUD OPERATIONS
    // ==========================================
    createProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId, categoryId, name, description, basePrice, suggestedMaxPrice, videoUrl, // Optional field for video URL
                 } = req.body;
                const product = yield product_services_1.default.createProduct(userId, {
                    shopId: Number(shopId),
                    categoryId: Number(categoryId),
                    name,
                    description,
                    basePrice: Number(basePrice),
                    suggestedMaxPrice: Number(suggestedMaxPrice),
                    videoUrl,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Product created successfully',
                    success: true,
                    data: product,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getProductDetailForAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                const product = yield product_services_1.default.getProductDetailForAdmin(userId, Number(productId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product details retrieved successfully',
                    success: true,
                    data: product,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateProduct(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                const { name, description, basePrice, suggestedMaxPrice, videoUrl } = req.body;
                const product = yield product_services_1.default.updateProduct(userId, Number(productId), Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (description && { description })), (basePrice && { basePrice: Number(basePrice) })), (suggestedMaxPrice && Object.assign({ suggestedMaxPrice: Number(suggestedMaxPrice) }, (videoUrl && { videoUrl })))));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product updated successfully',
                    success: true,
                    data: product,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    togglePublishStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                const { publish } = req.body;
                const product = yield product_services_1.default.togglePublishStatus(userId, Number(productId), Boolean(publish));
                res.status(200).json({
                    statusCode: 200,
                    message: `Product ${publish ? 'published' : 'unpublished'} successfully`,
                    success: true,
                    data: product,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ==========================================
    // VARIANT MANAGEMENT
    // ==========================================
    getProductVariants(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = req.params;
                const variants = yield product_services_1.default.getProductVariants(Number(productId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product variants retrieved successfully',
                    success: true,
                    data: variants,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    replaceVariants(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                const { variants } = req.body;
                const result = yield product_services_1.default.replaceVariants(userId, Number(productId), variants);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product variants replaced successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ==========================================
    // IMAGE MANAGEMENT
    // ==========================================
    addImages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                const { images } = req.body;
                const result = yield product_services_1.default.addImages(userId, Number(productId), images);
                res.status(201).json({
                    statusCode: 201,
                    message: 'Images added successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getImages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = req.params;
                const images = yield product_services_1.default.getImages(Number(productId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product images retrieved successfully',
                    success: true,
                    data: images,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { imageId } = req.params;
                const { isPrimary, hidden } = req.body;
                const image = yield product_services_1.default.updateImage(userId, Number(imageId), Object.assign(Object.assign({}, (isPrimary !== undefined && { isPrimary })), (hidden !== undefined && { hidden })));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Image updated successfully',
                    success: true,
                    data: image,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { imageId } = req.params;
                yield product_services_1.default.deleteImage(userId, Number(imageId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Image deleted successfully',
                    success: true,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteAllImages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                yield product_services_1.default.deleteAllImages(userId, Number(productId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'All product images deleted successfully',
                    success: true,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ==========================================
    // PRODUCT VIEWS
    // ==========================================
    getProductDetailForCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { productId } = req.params;
                const product = yield product_services_1.default.getProductDetailForCustomer(Number(productId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product details retrieved successfully',
                    success: true,
                    data: product,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getProductDetailForSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { productId } = req.params;
                const product = yield product_services_1.default.getProductDetailForSeller(Number(productId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Product details retrieved successfully',
                    success: true,
                    data: product,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getProductDetail(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { productId } = req.params;
            console.clear();
            const { userType, product } = yield product_services_1.default.getProductDetail({
                userId,
                productId: Number(productId),
            });
            res.status(200).json({
                statusCode: 200,
                message: 'Product details retrieved successfully',
                success: true,
                data: Object.assign({ userType }, product),
            });
        });
    }
    // ==========================================
    // PRODUCT LISTING
    // ==========================================
    getAllProductsForAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { search, shopId, published } = req.query;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10000;
                // No need for optional checks since validation middleware ensures required fields
                const result = yield product_services_1.default.getAllProductsForAdmin(userId, {
                    search: search === null || search === void 0 ? void 0 : search.toString(),
                    shopId: Number(shopId),
                    published: String(published) === 'true'
                        ? true
                        : String(published) === 'false'
                            ? false
                            : undefined,
                }, { page, limit });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Products retrieved successfully',
                    success: true,
                    data: {
                        products: result.data,
                        pagination: result.pagination,
                    },
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllProductsForCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { search, minPrice, maxPrice, categoryId } = req.query;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield product_services_1.default.getAllProductsForCustomer({
                    search: search === null || search === void 0 ? void 0 : search.toString(),
                    minPrice: minPrice ? Number(minPrice) : undefined,
                    maxPrice: maxPrice ? Number(maxPrice) : undefined,
                    categoryId: Number(categoryId),
                }, { page, limit });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Products retrieved successfully',
                    success: true,
                    data: result.data,
                    pagination: result.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllProductsForSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { search, minPrice, maxPrice, categoryId, shopId } = req.query;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield product_services_1.default.getAllProductsForSeller({
                    search: search === null || search === void 0 ? void 0 : search.toString(),
                    minPrice: minPrice ? Number(minPrice) : undefined,
                    maxPrice: maxPrice ? Number(maxPrice) : undefined,
                    categoryId: Number(categoryId),
                    shopId: Number(shopId),
                }, { page, limit });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Products retrieved successfully',
                    success: true,
                    data: result.data,
                    pagination: result.pagination,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { search, minPrice, maxPrice, categoryId, shopId } = req.query;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const { result, userType } = yield product_services_1.default.getAllProducts({
                    pagination: { page, limit },
                    userId,
                    filters: {
                        search: search === null || search === void 0 ? void 0 : search.toString(),
                        minPrice: minPrice ? Number(minPrice) : undefined,
                        maxPrice: maxPrice ? Number(maxPrice) : undefined,
                        categoryId: Number(categoryId),
                        shopId: Number(shopId),
                    },
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Products retrieved successfully',
                    success: true,
                    data: result.data,
                    pagination: result.pagination,
                    userType,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new ProductController();
