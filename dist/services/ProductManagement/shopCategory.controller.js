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
const shopCategory_services_1 = __importDefault(require("./shopCategory.services"));
class ShopCategoryController {
    // ==========================================
    // SHOP MANAGEMENT
    // ==========================================
    createShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopName, shopLocation, deliveryChargeInside, deliveryChargeOutside, shopDescription, shopIcon, } = req.body;
                const shop = yield shopCategory_services_1.default.createShop(userId, {
                    shopName,
                    shopLocation,
                    deliveryChargeInside,
                    deliveryChargeOutside,
                    shopDescription,
                    shopIcon,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Shop created successfully',
                    success: true,
                    data: shop,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { shopId } = req.params;
                const shop = yield shopCategory_services_1.default.getShop(Number(shopId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Shop retrieved successfully',
                    success: true,
                    data: shop,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllShops(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, shopName = '' } = req.query;
                const pageNumber = Number(page);
                const shops = yield shopCategory_services_1.default.getAllShops(pageNumber, Number(limit), String(shopName));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Shops retrieved successfully',
                    success: true,
                    data: shops,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllShopsForAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page = 1, limit = 10, shopName = '' } = req.query;
                const pageNumber = Number(page);
                const shops = yield shopCategory_services_1.default.getAllShopsForAdmin(userId, pageNumber, Number(limit), String(shopName));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Shops retrieved successfully',
                    success: true,
                    data: shops,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId } = req.params;
                const { shopName, shopLocation, deliveryChargeInside, deliveryChargeOutside, shopDescription, shopIcon, isActive, } = req.body;
                const shop = yield shopCategory_services_1.default.updateShop(userId, Number(shopId), {
                    shopName,
                    shopLocation,
                    deliveryChargeInside,
                    deliveryChargeOutside,
                    shopDescription,
                    shopIcon,
                    isActive,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Shop updated successfully',
                    success: true,
                    data: shop,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    openOrCloseShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId } = req.params;
                const { isActive } = req.body;
                const shop = yield shopCategory_services_1.default.openOrCloseShop(userId, Number(shopId), isActive);
                res.status(200).json({
                    statusCode: 200,
                    message: `Shop ${isActive ? 'opened' : 'closed'} successfully`,
                    success: true,
                    data: shop,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ==========================================
    // CATEGORY MANAGEMENT
    // ==========================================
    createCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { name, description, categoryIcon, parentId, priority } = req.body;
                const category = yield shopCategory_services_1.default.createCategory(userId, {
                    name,
                    description,
                    categoryIcon,
                    parentId: parentId ? Number(parentId) : null,
                    priority: priority ? Number(priority) : 1,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Category created successfully',
                    success: true,
                    data: category,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId } = req.params;
                const category = yield shopCategory_services_1.default.getCategory(Number(categoryId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Category retrieved successfully',
                    success: true,
                    data: category,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllCategories(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name = '', subCategories = false } = req.query;
                const categories = yield shopCategory_services_1.default.getAllCategories(String(name), Boolean(subCategories));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Categories retrieved successfully',
                    success: true,
                    data: categories,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { categoryId } = req.params;
                const { name, description, categoryIcon, parentId, priority } = req.body;
                const category = yield shopCategory_services_1.default.updateCategory(userId, Number(categoryId), {
                    name,
                    description,
                    categoryIcon,
                    parentId: parentId ? Number(parentId) : null,
                    priority: priority ? Number(priority) : 1,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Category updated successfully',
                    success: true,
                    data: category,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getCategoriesWithSubcategoriesAndProductCounts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { parentId = null } = req.query;
                const categories = yield shopCategory_services_1.default.getCategoriesWithAggregatedProductCounts(parentId ? Number(parentId) : null);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Categories with subcategories and product counts retrieved successfully',
                    success: true,
                    data: categories,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deleteCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { categoryId } = req.params;
                yield shopCategory_services_1.default.deleteCategory(userId, Number(categoryId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Category deleted successfully',
                    success: true,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    // ==========================================
    // SHOP-CATEGORY ASSIGNMENT
    // ==========================================
    assignCategoryToShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId, categoryId } = req.body;
                const shopCategory = yield shopCategory_services_1.default.assignCategoryToShop(userId, Number(shopId), Number(categoryId));
                res.status(201).json({
                    statusCode: 201,
                    message: 'Category assigned to shop successfully',
                    success: true,
                    data: shopCategory,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    removeCategoryFromShop(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId, categoryId } = req.params;
                yield shopCategory_services_1.default.removeCategoryFromShop(userId, Number(shopId), Number(categoryId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Category removed from shop successfully',
                    success: true,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getShopCategories(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { shopId } = req.params;
                const categories = yield shopCategory_services_1.default.getShopCategories(Number(shopId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Shop categories retrieved successfully',
                    success: true,
                    data: categories,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getShopsByCategory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId } = req.params;
                const shops = yield shopCategory_services_1.default.getShopsByCategory(Number(categoryId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Shops by category retrieved successfully',
                    success: true,
                    data: shops,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new ShopCategoryController();
