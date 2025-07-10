"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopCategoryAssignmentRouter = exports.categoryRouter = exports.shopRouter = void 0;
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const shopCategory_controller_1 = __importDefault(require("./shopCategory.controller"));
const shopCategory_validator_1 = __importDefault(require("./shopCategory.validator"));
class ShopRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ==========================================
        // SHOP MANAGEMENT ROUTES
        // ==========================================
        this.router.post('/', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.createShop(), validation_middleware_1.default, shopCategory_controller_1.default.createShop);
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, shopCategory_controller_1.default.getAllShopsForAdmin);
        this.router.get('/:shopId', shopCategory_validator_1.default.getShop(), validation_middleware_1.default, shopCategory_controller_1.default.getShop);
        this.router.get('/', shopCategory_controller_1.default.getAllShops);
        this.router.put('/:shopId', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.updateShop(), validation_middleware_1.default, shopCategory_controller_1.default.updateShop);
        this.router.get('/:shopId/categories', shopCategory_validator_1.default.getShopCategories(), validation_middleware_1.default, shopCategory_controller_1.default.getShopCategories);
        this.router.patch('/:shopId/status', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.openOrCloseShop(), validation_middleware_1.default, shopCategory_controller_1.default.openOrCloseShop);
        // ==========================================
        // CATEGORY MANAGEMENT ROUTES
        // ==========================================
        // ==========================================
        // SHOP-CATEGORY ASSIGNMENT ROUTES
        // ==========================================
    }
    getRouter() {
        return this.router;
    }
}
// create a class router for category management
class CategoryRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ==========================================
        // CATEGORY MANAGEMENT ROUTES
        // ==========================================
        this.router.post('/', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.createCategory(), validation_middleware_1.default, shopCategory_controller_1.default.createCategory);
        this.router.get('/:categoryId', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.getCategory(), validation_middleware_1.default, shopCategory_controller_1.default.getCategory);
        this.router.get('/', auth_middlewares_1.isAuthenticated, shopCategory_controller_1.default.getAllCategories);
        this.router.put('/:categoryId', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.updateCategory(), validation_middleware_1.default, shopCategory_controller_1.default.updateCategory);
        this.router.delete('/:categoryId', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.deleteCategory(), validation_middleware_1.default, shopCategory_controller_1.default.deleteCategory);
        this.router.get('/:categoryId/shops', shopCategory_validator_1.default.getShopsByCategory(), validation_middleware_1.default, shopCategory_controller_1.default.getShopsByCategory);
    }
    getRouter() {
        return this.router;
    }
}
// create a router for shop category assignment
class ShopCategoryAssignmentRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // ==========================================
        // SHOP-CATEGORY ASSIGNMENT ROUTES
        // ==========================================
        this.router.post('/', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.assignCategoryToShop(), validation_middleware_1.default, shopCategory_controller_1.default.assignCategoryToShop);
        this.router.delete('/:shopId/categories/:categoryId', auth_middlewares_1.isAuthenticated, shopCategory_validator_1.default.removeCategoryFromShop(), validation_middleware_1.default, shopCategory_controller_1.default.removeCategoryFromShop);
    }
    getRouter() {
        return this.router;
    }
}
exports.shopRouter = new ShopRouter().getRouter();
exports.categoryRouter = new CategoryRouter().getRouter();
exports.shopCategoryAssignmentRouter = new ShopCategoryAssignmentRouter().getRouter();
// Export a singleton instance
