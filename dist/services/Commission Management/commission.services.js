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
exports.CommissionService = void 0;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
class CommissionService {
    static validateCommissionRanges(data) {
        var _a;
        // Check for empty data
        if (data.length === 0) {
            throw new ApiError_1.default(400, 'Commission data not provided');
        }
        // Check for non-positive values
        for (const row of data) {
            if (row.startPrice <= 0) {
                throw new ApiError_1.default(400, `Start price must be positive (found ${row.startPrice})`);
            }
            if (row.endPrice !== null && row.endPrice <= 0) {
                throw new ApiError_1.default(400, `End price must be positive (found ${row.endPrice})`);
            }
            if (row.commission < 0) {
                throw new ApiError_1.default(400, `Commission amount can not be negative`);
            }
            if (row.level <= 0) {
                throw new ApiError_1.default(400, `Level must be positive (found ${row.level})`);
            }
        }
        // Group by level to validate each level's ranges
        const levels = new Map();
        for (const row of data) {
            if (!levels.has(row.level)) {
                levels.set(row.level, []);
            }
            (_a = levels.get(row.level)) === null || _a === void 0 ? void 0 : _a.push(row);
        }
        // Validate each level's ranges
        for (const [level, levelRanges] of levels) {
            // Sort ranges by startPrice
            const sortedRanges = [...levelRanges].sort((a, b) => a.startPrice - b.startPrice);
            // Check first range starts from 1
            const firstRange = sortedRanges[0];
            if (firstRange.startPrice !== 1) {
                throw new ApiError_1.default(400, `First price range for level ${level} must start from 1 (found ${firstRange.startPrice})`);
            }
            // Check that only the last range has null endPrice
            const openEndedRanges = sortedRanges.filter(r => r.endPrice === null);
            if (openEndedRanges.length !== 1 ||
                openEndedRanges[0] !== sortedRanges[sortedRanges.length - 1]) {
                throw new ApiError_1.default(400, `Only the last price range for level ${level} can be open-ended (null endPrice)`);
            }
            // Check for continuous ranges without gaps
            for (let i = 0; i < sortedRanges.length - 1; i++) {
                const current = sortedRanges[i];
                const next = sortedRanges[i + 1];
                if (current.endPrice === null) {
                    throw new ApiError_1.default(400, 'Only the last range can be open-ended');
                }
                if (current.endPrice !== next.startPrice) {
                    throw new ApiError_1.default(400, `Price ranges must be continuous for level ${level}: ` +
                        `Range ${current.startPrice}-${current.endPrice} must connect to ` +
                        `range ${next.startPrice}-${next.endPrice}`);
                }
            }
        }
    }
    static transformToDatabaseFormat(data) {
        return data.map(row => ({
            startPrice: new client_1.Prisma.Decimal(row.startPrice),
            endPrice: row.endPrice !== null ? new client_1.Prisma.Decimal(row.endPrice) : null,
            level: row.level,
            commission: new client_1.Prisma.Decimal(row.commission),
        }));
    }
    replaceCommissionTable(adminId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.OTHER, client_1.ActionType.ALL);
            // Validate input data
            CommissionService.validateCommissionRanges(data);
            // Transform to database format
            const commissionEntries = CommissionService.transformToDatabaseFormat(data);
            // Transaction for atomic replacement
            return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Clear existing data
                yield tx.commission.deleteMany();
                // Insert new data
                yield tx.commission.createMany({
                    data: commissionEntries,
                });
                // Return the newly created data
                return this.formatCommissionTable(yield tx.commission.findMany({
                    orderBy: [{ level: 'asc' }, { startPrice: 'asc' }],
                }));
            }));
        });
    }
    formatCommissionTable(commissions) {
        return commissions.map(c => {
            var _a, _b;
            return ({
                startPrice: c.startPrice.toNumber(),
                endPrice: (_b = (_a = c.endPrice) === null || _a === void 0 ? void 0 : _a.toNumber()) !== null && _b !== void 0 ? _b : null,
                level: c.level,
                commission: c.commission.toNumber(),
            });
        });
    }
    getCommissionTable() {
        return __awaiter(this, void 0, void 0, function* () {
            const commissions = yield prisma_1.default.commission.findMany({
                orderBy: [{ level: 'asc' }, { startPrice: 'asc' }],
            });
            return this.formatCommissionTable(commissions);
        });
    }
    getCommissionByPriceAndLevel(price, level) {
        return __awaiter(this, void 0, void 0, function* () {
            if (price <= 0) {
                throw new ApiError_1.default(400, 'Price must be positive');
            }
            const commission = yield prisma_1.default.commission.findFirst({
                where: {
                    level,
                    startPrice: { lte: price },
                    OR: [
                        { endPrice: { gte: price } },
                        { endPrice: null }, // For open-ended ranges
                    ],
                },
            });
            if (!commission) {
                throw new ApiError_1.default(404, `No commission found for price ${price} at level ${level}`);
            }
            return commission.commission.toNumber();
        });
    }
    calculateUserCommissions(userPhone_1, price_1) {
        return __awaiter(this, arguments, void 0, function* (userPhone, price, tx = prisma_1.default) {
            if (price <= 0) {
                throw new ApiError_1.default(400, 'Price must be positive');
            }
            const parentTree = yield this.getUserParentTree(userPhone, tx);
            const result = yield Promise.all(parentTree.map((parent) => __awaiter(this, void 0, void 0, function* () {
                return ({
                    phoneNo: parent.phoneNo,
                    name: parent.name,
                    level: parent.level,
                    userId: parent.userId,
                    commissionAmount: yield this.getCommissionByPriceAndLevel(price, parent.level),
                });
            })));
            // Filter out users with zero commission
            return result.filter(user => user.commissionAmount > 0);
        });
    }
    getUserParentTree(userPhone_1) {
        return __awaiter(this, arguments, void 0, function* (userPhone, tx = prisma_1.default) {
            return yield tx.$queryRaw `
      WITH RECURSIVE parent_tree AS (
        SELECT 
          "phoneNo", 
          "name", 
          "userId",
          0 AS "level", 
          "referredByPhone"
        FROM "users"
        WHERE "phoneNo" = ${userPhone}
        
        UNION ALL
        
        SELECT 
          u."phoneNo", 
          u."name", 
          u."userId",
          pt."level" + 1 AS "level", 
          u."referredByPhone"
        FROM "users" u
        JOIN parent_tree pt ON u."phoneNo" = pt."referredByPhone"
      )
      SELECT 
        "phoneNo", 
        "name", 
        "level",
        "userId"
      FROM parent_tree
      WHERE "phoneNo" != ${userPhone}
      ORDER BY "level"
    `;
        });
    }
}
exports.CommissionService = CommissionService;
exports.default = new CommissionService();
