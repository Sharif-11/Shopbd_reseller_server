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
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const order_service_1 = require("../Order Services/order.service");
const NotificationService_1 = require("../Real-Time-Notification/NotificationService");
const block_services_1 = require("../UserManagement/Block Management/block.services");
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
const transaction_services_1 = require("../Utility Services/Transaction Services/transaction.services");
const wallet_services_1 = __importDefault(require("../WalletManagement/wallet.services"));
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
    createDuePayment(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, walletName, walletPhoneNo, amount, transactionId, systemWalletPhoneNo, }) {
            // check user is blocked
            const isBlocked = yield block_services_1.blockServices.isUserBlocked(walletPhoneNo, client_1.BlockActionType.PAYMENT_REQUEST);
            if (isBlocked) {
                throw new ApiError_1.default(400, 'You are blocked from payment request. Please contact support');
            }
            yield this.checkExistingTransactionId(transactionId);
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const systemWallet = yield wallet_services_1.default.checkSystemWalletOwnership({
                systemWalletPhoneNo,
                systemWalletName: walletName,
            });
            const payment = yield prisma_1.default.payment.create({
                data: {
                    userName: user.name,
                    userPhoneNo: walletPhoneNo,
                    amount,
                    transactionId,
                    systemWalletPhoneNo,
                    paymentType: 'DUE_PAYMENT',
                    paymentStatus: 'PENDING',
                    userWalletName: walletName,
                    userWalletPhoneNo: walletPhoneNo,
                    sender: 'SELLER',
                },
            });
            const admins = yield user_services_1.default.getUsersWithPermission(client_1.PermissionType.PAYMENT_MANAGEMENT, 'READ');
            const adminIds = admins.map(admin => admin.userId);
            NotificationService_1.notificationService.addNotification({
                title: 'বকেয়া পরিশোধের অনুরোধ',
                message: `${user.name} বকেয়া পরিশোধের অনুরোধ করেছেন।`,
                type: 'PAYMENT_REQUEST',
            }, adminIds);
            return payment;
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
            const isBlocked = yield block_services_1.blockServices.isUserBlocked(userPhoneNo, client_1.BlockActionType.PAYMENT_REQUEST);
            if (isBlocked) {
                throw new ApiError_1.default(400, 'You are blocked from payment request. Please contact support');
            }
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
                    paymentStatus: paymentType === 'CUSTOMER_REFUND' ? 'COMPLETED' : 'PENDING',
                },
            });
            return payment;
        });
    }
    verifyPaymentByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, paymentId, transactionId, }) {
            // verify permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.PAYMENT_MANAGEMENT, 'APPROVE');
            // check if payment exists
            const payment = yield prisma_1.default.payment.findUnique({
                where: { paymentId },
            });
            if (!payment) {
                throw new Error('Payment not found');
            }
            // check if transactionId matches
            if (payment.transactionId !== transactionId) {
                throw new Error('Transaction ID does not match');
            }
            let updatedPayment = null;
            // update payment status
            if (payment.paymentType === 'DUE_PAYMENT') {
                updatedPayment = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // update payment status and create a transaction
                    const result = yield tx.payment.update({
                        where: { paymentId },
                        data: {
                            paymentStatus: 'COMPLETED',
                            processedAt: new Date(),
                        },
                    });
                    // create a transaction
                    yield transaction_services_1.transactionServices.createTransaction({
                        tx,
                        amount: payment.amount.toNumber(),
                        userPhoneNo: payment.userPhoneNo,
                        reason: 'বকেয়া পরিশোধ',
                        transactionType: 'Credit',
                    });
                }));
                return updatedPayment;
            }
            else if (payment.paymentType === 'ORDER_PAYMENT') {
                const updatedPayment = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const order = yield tx.order.findFirst({
                        where: { Payment: { paymentId } },
                    });
                    if (!order) {
                        throw new Error('Order not found for this payment');
                    }
                    // update payment status
                    const updatedPayment = yield tx.payment.update({
                        where: { paymentId },
                        data: {
                            paymentStatus: 'COMPLETED',
                            processedAt: new Date(),
                        },
                    });
                    // update order status
                    yield order_service_1.orderService.confirmOrderByAdmin({
                        tx,
                        orderId: order.orderId,
                    });
                }));
            }
            else {
                updatedPayment = yield prisma_1.default.payment.update({
                    where: { paymentId },
                    data: {
                        paymentStatus: 'COMPLETED',
                        processedAt: new Date(),
                    },
                });
                // check if there any order associated with this payment
            }
            return updatedPayment;
        });
    }
    rejectPaymentByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, paymentId, remarks, }) {
            // verify permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.PAYMENT_MANAGEMENT, 'REJECT');
            // check user is blocked
            // check if payment exists
            const payment = yield prisma_1.default.payment.findUnique({
                where: { paymentId },
            });
            if (!payment) {
                throw new Error('Payment not found');
            }
            // count total rejected payments for the user
            const totalRejectedPayments = yield prisma_1.default.payment.count({
                where: {
                    userPhoneNo: payment.userPhoneNo,
                    paymentStatus: 'REJECTED',
                },
            });
            if (totalRejectedPayments >= config_1.default.maxRejectedPaymentLimit) {
                // block user if they have 3 or more rejected payments
                yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    if (payment.paymentType === 'ORDER_PAYMENT') {
                        const order = yield order_service_1.orderService.rejectOrderByAdmin({
                            tx,
                            orderId: payment.orderId,
                        });
                        if (order.orderStatus !== 'REJECTED') {
                            return;
                        }
                    }
                    // delete all those rejected payments
                    yield tx.payment.deleteMany({
                        where: {
                            userPhoneNo: payment.userPhoneNo,
                            paymentStatus: 'REJECTED',
                        },
                    });
                    // block user
                    yield block_services_1.blockServices.createBlockRecordBySystem({
                        actions: [
                            {
                                actionType: client_1.BlockActionType.PAYMENT_REQUEST,
                                active: true,
                                reason: 'Too many rejected payments',
                                expiresAt: null, // no expiration for this block
                            },
                        ],
                        userPhoneNo: payment.userPhoneNo,
                        tx,
                    });
                }));
                return null;
            }
            else {
                if (payment.paymentType === 'ORDER_PAYMENT') {
                    return yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                        yield order_service_1.orderService.rejectOrderByAdmin({
                            tx,
                            orderId: payment.orderId,
                        });
                        return yield tx.payment.update({
                            where: { paymentId },
                            data: {
                                paymentStatus: 'REJECTED',
                                remarks,
                                processedAt: new Date(),
                                transactionId: null, // clear transactionId on rejection
                            },
                        });
                    }));
                }
                else {
                    return yield prisma_1.default.payment.update({
                        where: { paymentId },
                        data: {
                            paymentStatus: 'REJECTED',
                            remarks,
                            processedAt: new Date(),
                            transactionId: null, // clear transactionId on rejection
                        },
                    });
                }
            }
        });
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
                orderBy: { paymentDate: 'desc' },
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
                        { systemWalletPhoneNo: { contains: search, mode: 'insensitive' } },
                    ]
                    : undefined,
            };
            const skip = (Number(page || 1) - 1) * (limit || 10);
            const payments = yield prisma_1.default.payment.findMany({
                where,
                orderBy: { paymentDate: 'desc' },
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
    getPaymentByIdForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, paymentId, }) {
            // verify permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.PAYMENT_MANAGEMENT, 'READ');
            const payment = yield prisma_1.default.payment.findUnique({
                where: { paymentId },
            });
            if (!payment) {
                throw new ApiError_1.default(404, 'Payment not found');
            }
            return payment;
        });
    }
}
exports.default = new PaymentService();
