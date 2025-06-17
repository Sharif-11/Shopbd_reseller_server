"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const product_controller_1 = __importDefault(require("./product.controller"));
const product_validator_1 = __importDefault(require("./product.validator"));
class ProductRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ==========================================
        // PRODUCT CRUD ROUTES
        // ==========================================
        this.router.post('/', auth_middlewares_1.isAuthenticated, product_validator_1.default.createProduct(), validation_middleware_1.default, product_controller_1.default.createProduct);
        this.router.put('/:productId', auth_middlewares_1.isAuthenticated, product_validator_1.default.updateProduct(), validation_middleware_1.default, product_controller_1.default.updateProduct);
        this.router.patch('/:productId/publish', auth_middlewares_1.isAuthenticated, product_validator_1.default.togglePublishStatus(), validation_middleware_1.default, product_controller_1.default.togglePublishStatus);
        // ==========================================
        // VARIANT MANAGEMENT ROUTES
        // ==========================================
        this.router.get('/:productId/variants', product_validator_1.default.getProductVariants(), validation_middleware_1.default, product_controller_1.default.getProductVariants);
        this.router.put('/:productId/variants', auth_middlewares_1.isAuthenticated, product_validator_1.default.replaceVariants(), validation_middleware_1.default, product_controller_1.default.replaceVariants);
        // ==========================================
        // IMAGE MANAGEMENT ROUTES
        // ==========================================
        this.router.post('/:productId/images', auth_middlewares_1.isAuthenticated, product_validator_1.default.addImages(), validation_middleware_1.default, product_controller_1.default.addImages);
        this.router.get('/:productId/images', product_validator_1.default.getImages(), validation_middleware_1.default, product_controller_1.default.getImages);
        this.router.patch('/images/:imageId', auth_middlewares_1.isAuthenticated, product_validator_1.default.updateImage(), validation_middleware_1.default, product_controller_1.default.updateImage);
        this.router.delete('/images/:imageId', auth_middlewares_1.isAuthenticated, product_validator_1.default.deleteImage(), validation_middleware_1.default, product_controller_1.default.deleteImage);
        this.router.delete('/:productId/images', auth_middlewares_1.isAuthenticated, product_validator_1.default.deleteAllImages(), validation_middleware_1.default, product_controller_1.default.deleteAllImages);
        // ==========================================
        // PRODUCT VIEW ROUTES
        // ==========================================
        this.router.get('/admin/:productId', auth_middlewares_1.isAuthenticated, product_validator_1.default.getProductDetailForAdmin(), validation_middleware_1.default, product_controller_1.default.getProductDetailForAdmin);
        this.router.get('/customer/:productId', product_validator_1.default.getProductDetailForCustomer(), validation_middleware_1.default, product_controller_1.default.getProductDetailForCustomer);
        this.router.get('/seller/:productId', auth_middlewares_1.isAuthenticated, product_validator_1.default.getProductDetailForSeller(), validation_middleware_1.default, product_controller_1.default.getProductDetailForSeller);
        // ==========================================
        // PRODUCT LISTING ROUTES
        // ==========================================
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, product_validator_1.default.getAllProductsForAdmin(), validation_middleware_1.default, product_controller_1.default.getAllProductsForAdmin);
        this.router.get('/customer', product_validator_1.default.getAllProductsForCustomer(), validation_middleware_1.default, product_controller_1.default.getAllProductsForCustomer);
        this.router.get('/seller', auth_middlewares_1.isAuthenticated, product_validator_1.default.getAllProductsForSeller(), validation_middleware_1.default, product_controller_1.default.getAllProductsForSeller);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new ProductRouter().getRouter();
