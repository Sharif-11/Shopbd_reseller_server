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
const prisma_1 = __importDefault(require("../../utils/prisma"));
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
class PaymentService {
    checkExistingTransactionId(transactionId_1) {
        return __awaiter(this, arguments, void 0, function* (transactionId, tx = undefined) {
            const existingTransaction = yield (tx || prisma_1.default).payment.findUnique({
                where: { transactionId },
            });
            if (existingTransaction) {
                throw new Error('Transaction ID already exists');
            }
            return existingTransaction;
        });
    }
    createWithdrawPayment(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userName, userPhoneNo, amount, transactionFee, systemWalletPhoneNo, systemWalletName, transactionId, userWalletName, userWalletPhoneNo, tx, }) {
            yield this.checkExistingTransactionId(transactionId, tx);
            const payment = yield (tx || prisma_1.default).payment.create({
                data: {
                    userName,
                    userPhoneNo,
                    amount,
                    transactionFee,
                    systemWalletPhoneNo,
                    systemWalletName,
                    transactionId,
                    paymentType: 'WITHDRAWAL_PAYMENT',
                    paymentStatus: 'COMPLETED',
                    processedAt: new Date(),
                    actualAmount: amount - transactionFee,
                    sender: 'SYSTEM',
                    userWalletName,
                    userWalletPhoneNo,
                },
            });
            return payment;
        });
    }
    createPayment(_a) {
        return __awaiter(this, arguments, void 0, function* ({ tx, paymentType, sender, userWalletName, userWalletPhoneNo, systemWalletPhoneNo, amount, transactionId, userName, userPhoneNo, }) {
            yield this.checkExistingTransactionId(transactionId, tx);
            const payment = yield (tx || prisma_1.default).payment.create({
                data: {
                    paymentType,
                    sender,
                    userWalletName,
                    userWalletPhoneNo,
                    systemWalletPhoneNo,
                    amount,
                    transactionId,
                    userName,
                    userPhoneNo,
                },
            });
            return payment;
        });
    }
    verifyPaymentByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, tx, paymentId, transactionId, }) {
            // verify permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.PAYMENT_MANAGEMENT, 'APPROVE');
            // check if payment exists
            const payment = yield (tx || prisma_1.default).payment.findUnique({
                where: { paymentId },
            });
            if (!payment) {
                throw new Error('Payment not found');
            }
            // check if transactionId matches
            if (payment.transactionId !== transactionId) {
                throw new Error('Transaction ID does not match');
            }
            // update payment status
            const updatedPayment = yield (tx || prisma_1.default).payment.update({
                where: { paymentId },
                data: {
                    paymentStatus: 'COMPLETED',
                    processedAt: new Date(),
                },
            });
            return updatedPayment;
        });
    }
    rejectPaymentByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({}) { });
    }
    getAllPaymentsOfAUser(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userPhoneNo, paymentStatus, page, limit, search, }) {
            const where = {
                userPhoneNo,
                paymentStatus: paymentStatus
                    ? Array.isArray(paymentStatus)
                        ? { in: paymentStatus }
                        : paymentStatus
                    : undefined,
            };
            if (search) {
                where.OR = [
                    { userName: { contains: search, mode: 'insensitive' } },
                    { transactionId: { contains: search, mode: 'insensitive' } },
                    {
                        userWalletName: { contains: search, mode: 'insensitive' },
                    },
                    {
                        userWalletPhoneNo: { contains: search, mode: 'insensitive' },
                    },
                ];
            }
            const skip = (Number(page || 0) - 1) * (limit || 10);
            const payments = yield prisma_1.default.payment.findMany({
                where,
                skip,
                take: limit || 10,
                orderBy: { processedAt: 'desc', paymentDate: 'desc' },
            });
            const totalCount = yield prisma_1.default.payment.count({ where });
            return {
                payments,
                totalCount,
                totalPages: Math.ceil(totalCount / (limit || 10)),
                currentPage: page || 1,
            };
        });
    }
    getAllPaymentsForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, paymentStatus, search, transactionId, page, limit, }) {
            // verify permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.PAYMENT_MANAGEMENT, 'READ');
            const where = {
                paymentStatus: paymentStatus
                    ? Array.isArray(paymentStatus)
                        ? { in: paymentStatus }
                        : paymentStatus
                    : undefined,
                transactionId: transactionId
                    ? { contains: transactionId, mode: 'insensitive' }
                    : undefined,
                OR: search
                    ? [
                        { userWalletName: { contains: search, mode: 'insensitive' } },
                        { userWalletPhoneNo: { contains: search, mode: 'insensitive' } },
                        { userName: { contains: search, mode: 'insensitive' } },
                        { userPhoneNo: { contains: search, mode: 'insensitive' } },
                    ]
                    : undefined,
            };
            const skip = (Number(page || 0) - 1) * (limit || 10);
            const payments = yield prisma_1.default.payment.findMany({
                where,
                orderBy: { processedAt: 'desc', paymentDate: 'desc' },
                skip,
                take: limit || 10,
            });
            const totalCount = yield prisma_1.default.payment.count({ where });
            return {
                payments,
                totalCount,
                totalPages: Math.ceil(totalCount / (limit || 10)),
                currentPage: page || 1,
            };
        });
    }
}
exports.default = new PaymentService();
