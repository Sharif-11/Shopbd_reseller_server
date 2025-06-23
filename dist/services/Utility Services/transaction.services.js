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
const prisma_1 = __importDefault(require("../../utils/prisma"));
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
        return __awaiter(this, arguments, void 0, function* ({ tx, userId, userPhoneNo, amount, reason, reference, }) {
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
            if (amount < 0) {
                yield this.deductBalance({
                    userId: user.userId,
                    amount: Math.abs(amount),
                    tx,
                });
            }
            if (amount > 0) {
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
                    amount,
                    reason,
                    reference,
                },
            });
        });
    }
    // Additional methods for transaction retrieval, etc. can be added here
    getAllTransactionsForUser(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, page, limit, search, }) {
            const offset = (page || 1) - 1;
            const take = limit || 10;
            const where = Object.assign({ userId }, (search && {
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
            });
            return transactions;
        });
    }
    getAllTransactionsForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ page, limit, search, }) {
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
            });
            return transactions;
        });
    }
}
exports.transactionServices = new TransactionService();
