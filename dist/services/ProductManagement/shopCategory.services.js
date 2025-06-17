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
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
class ShopCategoryServices {
    // ==========================================
    // PERMISSION CHECKS
    // ==========================================
    // ==========================================
    // SHOP MANAGEMENT
    // ==========================================
    createShop(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.CREATE);
            const shop = yield prisma_1.default.shop.create({
                data: Object.assign(Object.assign({}, data), { isActive: true }),
            });
            return shop;
        });
    }
    getShop(shopId) {
        return __awaiter(this, void 0, void 0, function* () {
            const shop = yield prisma_1.default.shop.findUnique({
                where: { shopId },
                include: {
                    shopCategories: {
                        include: {
                            category: true,
                        },
                    },
                },
            });
            if (!shop)
                throw new ApiError_1.default(404, 'Shop not found');
            return Object.assign(Object.assign({}, shop), { categories: shop.shopCategories.map(sc => sc.category) });
        });
    }
    getAllShops() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.shop.findMany({
                where: { isActive: true },
            });
        });
    }
    getAllShopsForAdmin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // check permissions for admin
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.READ);
            return prisma_1.default.shop.findMany({
                include: {
                    shopCategories: {
                        include: {
                            category: true,
                        },
                    },
                },
            });
        });
    }
    updateShop(userId, shopId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            // Verify shop exists
            const shopExists = yield prisma_1.default.shop.findUnique({ where: { shopId } });
            if (!shopExists)
                throw new ApiError_1.default(404, 'Shop not found');
            return prisma_1.default.shop.update({
                where: { shopId },
                data,
            });
        });
    }
    // ==========================================
    // CATEGORY MANAGEMENT
    // ==========================================
    createCategory(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.CREATE);
            return prisma_1.default.category.create({ data });
        });
    }
    getCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield prisma_1.default.category.findUnique({
                where: { categoryId },
                include: {
                    shopCategories: {
                        include: {
                            shop: true,
                        },
                    },
                },
            });
            if (!category)
                throw new ApiError_1.default(404, 'Category not found');
            return Object.assign(Object.assign({}, category), { shops: category.shopCategories.map(sc => sc.shop) });
        });
    }
    getAllCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.category.findMany();
        });
    }
    updateCategory(userId, categoryId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            return prisma_1.default.category.update({
                where: { categoryId },
                data,
            });
        });
    }
    deleteCategory(userId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.DELETE);
            // Check if category is used in any products
            const productsCount = yield prisma_1.default.product.count({
                where: { categoryId },
            });
            if (productsCount > 0) {
                throw new ApiError_1.default(400, 'Cannot delete category with associated products');
            }
            yield prisma_1.default.$transaction([
                prisma_1.default.shopCategory.deleteMany({ where: { categoryId } }),
                prisma_1.default.category.delete({ where: { categoryId } }),
            ]);
        });
    }
    // ==========================================
    // SHOP-CATEGORY ASSIGNMENT
    // ==========================================
    assignCategoryToShop(userId, shopId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            // Verify shop and category exist
            const [shopExists, categoryExists] = yield Promise.all([
                prisma_1.default.shop.findUnique({ where: { shopId } }),
                prisma_1.default.category.findUnique({ where: { categoryId } }),
            ]);
            if (!shopExists)
                throw new ApiError_1.default(404, 'Shop not found');
            if (!categoryExists)
                throw new ApiError_1.default(404, 'Category not found');
            return prisma_1.default.shopCategory.create({
                data: {
                    shopId,
                    categoryId,
                },
            });
        });
    }
    removeCategoryFromShop(userId, shopId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.DELETE);
            // Check if category is used in any products in this shop
            const productsCount = yield prisma_1.default.product.count({
                where: {
                    shopId,
                    categoryId,
                },
            });
            if (productsCount > 0) {
                throw new ApiError_1.default(400, 'Cannot remove category with associated products in this shop');
            }
            yield prisma_1.default.shopCategory.deleteMany({
                where: {
                    shopId,
                    categoryId,
                },
            });
        });
    }
    getShopCategories(shopId) {
        return __awaiter(this, void 0, void 0, function* () {
            const shop = yield prisma_1.default.shop.findUnique({
                where: { shopId },
                include: {
                    shopCategories: {
                        include: {
                            category: true,
                        },
                    },
                },
            });
            if (!shop)
                throw new ApiError_1.default(404, 'Shop not found');
            return shop.shopCategories.map(sc => sc.category);
        });
    }
    getShopsByCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield prisma_1.default.category.findUnique({
                where: { categoryId },
                include: {
                    shopCategories: {
                        include: {
                            shop: true,
                        },
                    },
                },
            });
            if (!category)
                throw new ApiError_1.default(404, 'Category not found');
            return category.shopCategories.map(sc => sc.shop);
        });
    }
}
exports.default = new ShopCategoryServices();
