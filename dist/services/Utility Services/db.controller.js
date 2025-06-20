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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class DatabaseController {
    /**
     * Reset all database tables (DANGEROUS OPERATION)
     */
    resetDatabase(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Disable foreign key checks temporarily (PostgreSQL specific)
                yield prisma.$executeRaw `SET session_replication_role = 'replica';`;
                // Delete data from all tables in the correct order
                yield prisma.$transaction([
                    prisma.blockAction.deleteMany(),
                    prisma.block.deleteMany(),
                    prisma.userRole.deleteMany(),
                    prisma.rolePermission.deleteMany(),
                    prisma.role.deleteMany(),
                    prisma.walletOtp.deleteMany(),
                    prisma.wallet.deleteMany(),
                    prisma.customer.deleteMany(),
                    prisma.user.deleteMany({ where: {} }),
                    prisma.otp.deleteMany(),
                    prisma.productVariant.deleteMany(),
                    prisma.productImage.deleteMany(),
                    prisma.product.deleteMany(),
                    prisma.shopCategory.deleteMany(),
                    prisma.category.deleteMany(),
                    prisma.shop.deleteMany(),
                ]);
                // Re-enable foreign key checks
                yield prisma.$executeRaw `SET session_replication_role = 'origin';`;
                res.status(200).json({
                    statusCode: 200,
                    message: 'Database reset successfully',
                    success: true,
                    data: {
                        tablesReset: [
                            'blockAction',
                            'block',
                            'userRole',
                            'rolePermission',
                            'role',
                            'walletOtp',
                            'wallet',
                            'customer',
                            'user',
                            'otp',
                            'productVariant',
                            'productImage',
                            'product',
                            'shopCategory',
                            'category',
                            'shop',
                        ],
                    },
                });
            }
            catch (error) {
                next(error);
            }
            finally {
                yield prisma.$disconnect();
            }
        });
    }
    /**
     * Reset specific tables (safer alternative)
     */
    resetSpecificTables(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tables } = req.body;
                if (!tables || !Array.isArray(tables)) {
                    return res.status(400).json({
                        statusCode: 400,
                        message: 'Please provide an array of tables to reset',
                        success: false,
                    });
                }
                // Disable foreign key checks temporarily
                yield prisma.$executeRaw `SET session_replication_role = 'replica';`;
                const deleteOperations = tables
                    .map(table => {
                    switch (table) {
                        case 'blockAction':
                            return prisma.blockAction.deleteMany();
                        case 'block':
                            return prisma.block.deleteMany();
                        case 'userRole':
                            return prisma.userRole.deleteMany();
                        case 'rolePermission':
                            return prisma.rolePermission.deleteMany();
                        case 'role':
                            return prisma.role.deleteMany();
                        case 'walletOtp':
                            return prisma.walletOtp.deleteMany();
                        case 'wallet':
                            return prisma.wallet.deleteMany();
                        case 'customer':
                            return prisma.customer.deleteMany();
                        case 'user':
                            return prisma.user.deleteMany();
                        case 'otp':
                            return prisma.otp.deleteMany();
                        case 'productVariant':
                            return prisma.productVariant.deleteMany();
                        case 'productImage':
                            return prisma.productImage.deleteMany();
                        case 'product':
                            return prisma.product.deleteMany();
                        case 'shopCategory':
                            return prisma.shopCategory.deleteMany();
                        case 'category':
                            return prisma.category.deleteMany();
                        case 'shop':
                            return prisma.shop.deleteMany();
                        default:
                            return null;
                    }
                })
                    .filter(op => op !== null);
                yield prisma.$transaction(deleteOperations);
                // Re-enable foreign key checks
                yield prisma.$executeRaw `SET session_replication_role = 'origin';`;
                res.status(200).json({
                    statusCode: 200,
                    message: 'Specified tables reset successfully',
                    success: true,
                    data: { tablesReset: tables },
                });
            }
            catch (error) {
                next(error);
            }
            finally {
                yield prisma.$disconnect();
            }
        });
    }
}
exports.default = new DatabaseController();
