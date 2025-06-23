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
exports.withdrawService = void 0;
const client_1 = require("@prisma/client");
const decimal_js_1 = __importDefault(require("decimal.js"));
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const payment_service_1 = __importDefault(require("../Payment Service/payment.service"));
const block_services_1 = require("../UserManagement/Block Management/block.services");
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
const transaction_services_1 = require("../Utility Services/transaction.services");
const wallet_services_1 = __importDefault(require("../WalletManagement/wallet.services"));
const withdraw_utils_1 = require("./withdraw.utils");
class WithdrawService {
    getWithdrawById(withdrawId) {
        return __awaiter(this, void 0, void 0, function* () {
            const withdraw = yield prisma_1.default.withdraw.findUnique({
                where: { withdrawId },
            });
            if (!withdraw) {
                throw new Error('Withdraw request not found');
            }
            return withdraw;
        });
    }
    createWithdraw(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, amount, walletName, walletPhoneNo, }) {
            var _b;
            const decimalAmount = new decimal_js_1.default(amount);
            if (decimalAmount.isNegative() || decimalAmount.isZero()) {
                throw new Error('Amount must be greater than zero');
            }
            if (decimalAmount.greaterThan(config_1.default.maximumWithdrawAmount)) {
                throw new Error('Amount exceeds the maximum withdraw limit');
            }
            const user = yield user_services_1.default.getUserByIdWithLock(userId);
            // check user block status
            const isBlocked = yield block_services_1.blockServices.isUserBlocked(user.phoneNo, client_1.BlockActionType.WITHDRAW_REQUEST);
            if (isBlocked) {
                throw new Error('You are blocked from making withdraw requests. Please contact support.');
            }
            // check if user has sufficient balance
            if ((((_b = user.balance) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0) < amount) {
                throw new Error('Insufficient balance for withdrawal');
            }
            const { actualAmount, transactionFee } = (0, withdraw_utils_1.calculateTransactionFee)({
                walletName: walletName,
                walletPhoneNo,
                amount,
            });
            // create withdraw request
            // check wallet ownership
            yield wallet_services_1.default.checkWalletOwnership(user.userId, walletPhoneNo, walletName);
            // check if user has a pending withdraw request
            const existingWithdraw = yield prisma_1.default.withdraw.findFirst({
                where: {
                    userId,
                    withdrawStatus: 'PENDING',
                },
            });
            if (existingWithdraw) {
                throw new ApiError_1.default(400, 'You already have a pending withdraw request. Please wait for it to be processed.');
            }
            // check if user  request two withdraws within 24 hours
            const lastWithdraw = yield prisma_1.default.withdraw.findFirst({
                where: {
                    userId,
                    withdrawStatus: 'COMPLETED',
                },
                orderBy: { requestedAt: 'desc' },
            });
            const timeDifference = lastWithdraw
                ? new Date().getTime() - new Date(lastWithdraw.requestedAt).getTime()
                : null;
            if (timeDifference && timeDifference < 24 * 60 * 60 * 1000) {
                throw new ApiError_1.default(400, 'You can only request one withdraw every 24 hours. Please try again later.');
            }
            const withdraw = yield prisma_1.default.withdraw.create({
                data: {
                    userId: user.userId,
                    amount,
                    walletName,
                    walletPhoneNo,
                    userName: user.name,
                    userPhoneNo: user.phoneNo,
                    transactionFee,
                    actualAmount,
                },
            });
            return withdraw;
        });
    }
    cancelWithdraw(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, withdrawId }) {
            const withdraw = yield this.getWithdrawById(withdrawId);
            if (withdraw.userId !== userId) {
                throw new ApiError_1.default(403, 'You are not authorized to cancel this withdraw request');
            }
            if (withdraw.withdrawStatus !== 'PENDING') {
                throw new ApiError_1.default(400, 'Only pending withdraw requests can be cancelled');
            }
            return yield prisma_1.default.withdraw.delete({
                where: { withdrawId },
            });
        });
    }
    approveWithdraw(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, withdrawId, systemWalletPhoneNo, transactionId, }) {
            // check permissions
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.WITHDRAWAL_MANAGEMENT, 'APPROVE');
            const withdraw = yield this.getWithdrawById(withdrawId);
            yield payment_service_1.default.checkExistingTransactionId(transactionId);
            // check if withdraw is already approved
            if (withdraw.withdrawStatus !== 'PENDING') {
                throw new ApiError_1.default(400, 'Only pending withdraw requests can be completed');
            }
            const updatedWithdraw = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const payment = yield payment_service_1.default.createWithdrawPayment({
                    tx,
                    userName: withdraw.userName,
                    userPhoneNo: withdraw.userPhoneNo,
                    amount: withdraw.amount.toNumber(),
                    transactionFee: ((_a = withdraw.transactionFee) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0,
                    systemWalletPhoneNo,
                    systemWalletName: withdraw.walletName, // TODO: Get actual system wallet name
                    transactionId,
                    userWalletName: withdraw.walletName,
                    userWalletPhoneNo: withdraw.walletPhoneNo,
                });
                // update withdraw status
                const updatedWithdraw = yield tx.withdraw.update({
                    where: { withdrawId },
                    data: {
                        withdrawStatus: 'COMPLETED',
                        paymentId: payment.paymentId,
                        processedAt: new Date(),
                        transactionId,
                        systemWalletPhoneNo,
                    },
                });
                // deduct balance from user
                yield transaction_services_1.transactionServices.createTransaction({
                    tx,
                    userId: withdraw.userId,
                    amount: -withdraw.amount.toNumber(),
                    reason: 'ব্যালেন্স উত্তোলন',
                });
                return updatedWithdraw;
            }));
            return updatedWithdraw;
            // check if system wallet exists
            // TODO: Implement approval logic
        });
    }
    rejectWithdraw(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, withdrawId, remarks }) {
            // check permissions
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.WITHDRAWAL_MANAGEMENT, 'REJECT');
            const withdraw = yield this.getWithdrawById(withdrawId);
            // check if withdraw is already approved
            if (withdraw.withdrawStatus !== 'PENDING') {
                throw new ApiError_1.default(400, 'Only pending withdraw requests can be rejected');
            }
            const updatedWithdraw = yield prisma_1.default.withdraw.update({
                where: { withdrawId },
                data: {
                    withdrawStatus: 'REJECTED',
                    processedAt: new Date(),
                    remarks,
                },
            });
            return updatedWithdraw;
        });
    }
    // Method to get all withdraw requests with pagination and filtering
    getWithdrawForSeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sellerId, page, limit, search, status }) {
            const offset = (page || 1) - 1;
            const take = limit || 10;
            const where = Object.assign({ sellerId, withdrawStatus: status ? (Array.isArray(status) ? { in: status } : status) : undefined }, (search && {
                OR: [
                    { userName: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { userPhoneNo: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { walletPhoneNo: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    {
                        walletName: { contains: search, mode: client_1.Prisma.QueryMode.insensitive },
                    }
                ],
            }));
            const withdraws = yield prisma_1.default.withdraw.findMany({
                where,
                skip: offset * take,
                take,
                orderBy: { processedAt: 'desc', requestedAt: 'desc' },
            });
            return withdraws;
        });
    }
    // Method to get all withdraw requests for admin with pagination and filtering
    getWithdrawForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, page, limit, search, status }) {
            // check permissions
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.WITHDRAWAL_MANAGEMENT, 'READ');
            const offset = (page || 1) - 1;
            const take = limit || 10;
            const where = Object.assign({ withdrawStatus: status ? (Array.isArray(status) ? { in: status } : status) : undefined }, (search && {
                OR: [
                    { userName: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { userPhoneNo: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } }, {
                        walletPhoneNo: { contains: search, mode: client_1.Prisma.QueryMode.insensitive },
                    },
                ],
            }));
            const withdraws = yield prisma_1.default.withdraw.findMany({
                where,
                skip: offset * take,
                take,
                orderBy: { processedAt: 'desc', requestedAt: 'desc' },
            });
            return withdraws;
        });
    }
}
exports.withdrawService = new WithdrawService();
