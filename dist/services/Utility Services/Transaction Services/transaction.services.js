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
exports.transactionServices = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../utils/prisma"));
const user_services_1 = __importDefault(require("../../UserManagement/user.services"));
class TransactionService {
    deductBalance(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, amount, tx, }) {
            if (amount <= 0) {
                throw new Error('Amount must be greater than zero');
            }
            // Logic to deduct balance from user's account with row lock
            yield tx.$executeRaw `SELECT * FROM "users" WHERE "userId" = ${userId} FOR UPDATE`;
            yield tx.$executeRaw `UPDATE "users" SET "balance" = "balance" - ${amount} WHERE "userId" = ${userId}`;
        });
    }
    addBalance(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, amount, tx, }) {
            if (amount <= 0) {
                throw new Error('Amount must be greater than zero');
            }
            // Logic to add balance to user's account with row lock
            yield tx.$executeRaw `SELECT * FROM "users" WHERE "userId" = ${userId} FOR UPDATE`;
            yield tx.$executeRaw `UPDATE "users" SET "balance" = "balance" + ${amount} WHERE "userId" = ${userId}`;
        });
    }
    createTransaction(_a) {
        return __awaiter(this, arguments, void 0, function* ({ tx, userId, userPhoneNo, amount, reason, reference, transactionType, }) {
            // Here we need to ensure that either userId or userPhoneNo is provided
            if (!userId && !userPhoneNo) {
                throw new Error('Either userId or userPhoneNo must be provided');
            }
            let user = null;
            if (userId) {
                user = yield tx.user.findUnique({
                    where: { userId },
                    select: { userId: true, phoneNo: true, balance: true, name: true },
                });
            }
            else if (userPhoneNo) {
                user = yield tx.user.findUnique({
                    where: { phoneNo: userPhoneNo },
                    select: { userId: true, phoneNo: true, balance: true, name: true },
                });
            }
            if (!user) {
                throw new Error('User not found');
            }
            if (transactionType === 'Debit') {
                yield this.deductBalance({
                    userId: user.userId,
                    amount: Math.abs(amount),
                    tx,
                });
            }
            if (transactionType === 'Credit') {
                yield this.addBalance({
                    userId: user.userId,
                    amount,
                    tx,
                });
            }
            // Create the transaction record
            const transaction = yield tx.transaction.create({
                data: {
                    userId: user.userId,
                    userPhoneNo: user.phoneNo,
                    userName: user.name,
                    amount: transactionType === 'Credit' ? amount : -amount,
                    reason,
                    reference,
                },
            });
            return transaction;
        });
    }
    // Additional methods for transaction retrieval, etc. can be added here
    getAllTransactionsForUser(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page, limit, search, }) {
            var _b, _c, _d, _e;
            const offset = (page || 1) - 1;
            const take = limit || 10;
            const where = Object.assign({ userId }, (search && {
                OR: [{ reason: { contains: search, mode: 'insensitive' } }],
            }));
            const transactions = yield prisma_1.default.transaction.findMany({
                where,
                skip: offset * take,
                take,
                orderBy: { createdAt: 'desc' },
            });
            const totalCount = yield prisma_1.default.transaction.count({ where });
            // count total credit and debit amount and calculate balance
            const totalCredit = yield prisma_1.default.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    userId,
                    amount: { gt: 0 },
                },
            });
            const totalDebit = yield prisma_1.default.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    userId,
                    amount: { lt: 0 },
                },
            });
            const balance = (((_b = totalCredit._sum.amount) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0) +
                (((_c = totalDebit._sum.amount) === null || _c === void 0 ? void 0 : _c.toNumber()) || 0);
            return {
                transactions,
                totalCount,
                currentPage: offset + 1,
                pageSize: take,
                balance,
                totalCredit: ((_d = totalCredit._sum.amount) === null || _d === void 0 ? void 0 : _d.toNumber()) || 0,
                totalDebit: ((_e = totalDebit._sum.amount) === null || _e === void 0 ? void 0 : _e.toNumber()) || 0,
            };
        });
    }
    getAllTransactionsForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page, limit, search, }) {
            // check permissions for admin
            yield user_services_1.default.verifyUserPermission(userId, client_1.PermissionType.ALL, client_1.ActionType.READ);
            const offset = (page || 1) - 1;
            const take = limit || 10;
            const where = Object.assign({}, (search && {
                OR: [
                    { reason: { contains: search, mode: 'insensitive' } },
                    { userName: { contains: search, mode: 'insensitive' } },
                    { userPhoneNo: { contains: search, mode: 'insensitive' } },
                ],
            }));
            const transactions = yield prisma_1.default.transaction.findMany({
                where,
                skip: offset * take,
                take,
                orderBy: { createdAt: 'desc' },
                // please reverse the amount sign for admin transactions
            });
            const totalCount = yield prisma_1.default.transaction.count({ where });
            // calculate total credit and debit amount and calculate balance, here the credit of user is the debit of the admin and vice versa
            return {
                transactions,
                totalCount,
                currentPage: offset + 1,
                pageSize: take,
            };
        });
    }
}
exports.transactionServices = new TransactionService();
