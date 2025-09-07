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
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, shopName) {
            const skip = (page - 1) * limit;
            const where = Object.assign({ isActive: true }, (shopName && {
                shopName: { contains: shopName, mode: 'insensitive' },
            }));
            const [shops, total] = yield Promise.all([
                prisma_1.default.shop.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { shopName: 'asc' },
                }),
                prisma_1.default.shop.count({ where }),
            ]);
            return {
                shops,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    getAllShopsForAdmin(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10, shopName) {
            // check permissions for admin
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.READ);
            const skip = (page - 1) * limit;
            const where = Object.assign({}, (shopName && {
                shopName: { contains: shopName, mode: 'insensitive' },
            }));
            const [shops, total] = yield Promise.all([
                prisma_1.default.shop.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        shopCategories: {
                            include: {
                                category: true,
                            },
                        },
                    },
                }),
                prisma_1.default.shop.count({ where }),
            ]);
            return {
                shops,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    updateShop(userId, shopId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.UPDATE);
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
    openOrCloseShop(userId, shopId, isActive) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.UPDATE);
            // Verify shop exists
            const shopExists = yield prisma_1.default.shop.findUnique({ where: { shopId } });
            if (!shopExists)
                throw new ApiError_1.default(404, 'Shop not found');
            return prisma_1.default.shop.update({
                where: { shopId },
                data: { isActive },
            });
        });
    }
    checkShopStatus(shopId) {
        return __awaiter(this, void 0, void 0, function* () {
            const shop = yield prisma_1.default.shop.findUnique({ where: { shopId } });
            if (!shop)
                throw new ApiError_1.default(404, 'Shop not found');
            return shop;
        });
    }
    // ==========================================
    // CATEGORY MANAGEMENT
    // ==========================================
    createCategory(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.CREATE);
            // Validate parent exists if provided
            if (data.parentId) {
                const parentExists = yield prisma_1.default.category.count({
                    where: { categoryId: data.parentId },
                });
                if (!parentExists) {
                    throw new Error('Parent category not found');
                }
            }
            return prisma_1.default.category.create({
                data: {
                    name: data.name,
                    description: data.description,
                    categoryIcon: data.categoryIcon,
                    parentId: data.parentId,
                    priority: data.priority || 1,
                },
            });
        });
    }
    updateCategory(userId, categoryId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.UPDATE);
            // Check if category exists
            const category = yield prisma_1.default.category.findUnique({
                where: { categoryId },
                select: { parentId: true },
            });
            if (!category)
                throw new ApiError_1.default(404, 'Category not found');
            // Prevent circular references if parentId is being changed
            if (data.parentId) {
                // Can't be parent of itself
                if (data.parentId === categoryId) {
                    throw new ApiError_1.default(400, 'Category cannot be a parent of itself');
                }
                // If parentId is provided, ensure it exists
                const parentExists = yield prisma_1.default.category.count({
                    where: { categoryId: data.parentId },
                });
                if (!parentExists) {
                    throw new ApiError_1.default(404, 'Parent category not found');
                }
                // Check if new parent is a descendant (would create circular reference)
                if (data.parentId &&
                    (yield this.isDescendant(categoryId, data.parentId))) {
                    throw new ApiError_1.default(400, 'Cannot set parent as it would create a circular reference');
                }
            }
            return prisma_1.default.category.update({
                where: { categoryId },
                data: {
                    name: data.name,
                    description: data.description,
                    categoryIcon: data.categoryIcon,
                    parentId: data.parentId,
                    priority: data.priority || 100,
                },
            });
        });
    }
    getCategoriesWithAggregatedProductCounts() {
        return __awaiter(this, arguments, void 0, function* (parentId = null) {
            const categories = yield prisma_1.default.category.findMany({
                where: {
                    parentId: parentId,
                },
                include: {
                    subCategories: {
                        include: {
                            _count: {
                                select: { Product: true },
                            },
                        },
                    },
                    _count: {
                        select: { Product: true },
                    },
                },
                orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
            });
            return categories.map(category => {
                // Calculate total products (current category + all subcategories)
                const totalProducts = category.subCategories.reduce((sum, sub) => sum + sub._count.Product, category._count.Product);
                return Object.assign(Object.assign({}, category), { products: totalProducts, subCategories: category.subCategories.map(subCategory => (Object.assign(Object.assign({}, subCategory), { products: subCategory._count.Product, _count: undefined, priority: subCategory.priority }))), _count: undefined, priority: category.priority });
            });
        });
    }
    // Helper method to check if a category is a descendant of another
    isDescendant(parentId, potentialChildId) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentId = potentialChildId;
            while (currentId) {
                const category = yield prisma_1.default.category.findUnique({
                    where: { categoryId: currentId },
                    select: { parentId: true },
                });
                if (!category)
                    return false;
                if (category.parentId === parentId)
                    return true;
                currentId = category.parentId || 0;
            }
            return false;
        });
    }
    getCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield prisma_1.default.category.findUnique({
                where: { categoryId },
                include: {
                    parentCategory: true,
                    subCategories: true,
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
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, name, subCategories = false) {
            const skip = (page - 1) * limit;
            const where = Object.assign({}, (name && {
                name: { contains: name, mode: 'insensitive' },
            }));
            const [categories, total] = yield Promise.all([
                prisma_1.default.category.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
                    include: {
                        subCategories: subCategories || false,
                    },
                }),
                prisma_1.default.category.count({ where }),
            ]);
            return {
                categories,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            };
        });
    }
    deleteCategory(userId_1, categoryId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, categoryId, options = {}) {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.DELETE);
            // First get the category with its children
            const category = yield prisma_1.default.category.findUnique({
                where: { categoryId },
                include: { subCategories: true },
            });
            if (!category) {
                throw new ApiError_1.default(404, 'Category not found');
            }
            // Check if category or any children have associated products
            if (options.deleteChildren) {
                // Check products in this category and all descendants
                const descendantIds = yield this.getAllDescendantIds(categoryId);
                const allCategoryIds = [categoryId, ...descendantIds];
                const productsCount = yield prisma_1.default.product.count({
                    where: { categoryId: { in: allCategoryIds } },
                });
                if (productsCount > 0) {
                    throw new ApiError_1.default(400, 'Cannot delete category tree with associated products');
                }
            }
            else {
                // Check only this category's products
                const productsCount = yield prisma_1.default.product.count({
                    where: { categoryId },
                });
                if (productsCount > 0) {
                    throw new ApiError_1.default(400, 'Cannot delete category with associated products');
                }
                // Check if category has children
                if (category.subCategories.length > 0) {
                    throw new ApiError_1.default(400, 'Category has child categories. Set deleteChildren or moveChildrenToParent option');
                }
            }
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Handle children based on options
                if (options.deleteChildren) {
                    // Delete all descendant categories
                    const descendantIds = yield this.getAllDescendantIds(categoryId);
                    yield tx.shopCategory.deleteMany({
                        where: { categoryId: { in: descendantIds } },
                    });
                    yield tx.category.deleteMany({
                        where: { categoryId: { in: descendantIds } },
                    });
                }
                else if (options.moveChildrenToParent) {
                    // Move children to this category's parent
                    yield tx.category.updateMany({
                        where: { parentId: categoryId },
                        data: { parentId: category.parentId },
                    });
                }
                // Delete shop category associations
                yield tx.shopCategory.deleteMany({ where: { categoryId } });
                // Finally delete the category itself
                yield tx.category.delete({ where: { categoryId } });
            }));
        });
    }
    // Helper method to get all descendant IDs (including nested children)
    getAllDescendantIds(parentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const descendants = yield prisma_1.default.$queryRaw `
    WITH RECURSIVE CategoryTree AS (
      SELECT categoryId FROM categories WHERE parentId = ${parentId}
      UNION ALL
      SELECT c.categoryId FROM categories c
      JOIN CategoryTree ct ON c.parentId = ct.categoryId
    )
    SELECT categoryId FROM CategoryTree
  `;
            return descendants.map(d => d.categoryId);
        });
    }
    // ==========================================
    // SHOP-CATEGORY ASSIGNMENT
    // ==========================================
    assignCategoryToShop(userId, shopId, categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.UPDATE);
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
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.PRODUCT_MANAGEMENT, client_1.ActionType.DELETE);
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
