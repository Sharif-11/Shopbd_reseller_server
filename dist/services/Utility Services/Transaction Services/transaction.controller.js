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
exports.transactionControllers = void 0;
const transaction_services_1 = require("./transaction.services");
class TransactionController {
    /**
     * Get all transactions for a user
     */
    getUserTransactions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit, search } = req.query;
                const transactions = yield transaction_services_1.transactionServices.getAllTransactionsForUser({
                    userId: userId,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Transactions retrieved successfully',
                    success: true,
                    data: transactions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all transactions (admin only)
     */
    getAllTransactions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit, search } = req.query;
                const transactions = yield transaction_services_1.transactionServices.getAllTransactionsForAdmin({
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                    userId: userId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'All transactions retrieved successfully',
                    success: true,
                    data: transactions,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateBalanceByAdminToSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { sellerId } = req.params;
                const { amount, reason, transactionType } = req.body;
                const transaction = yield transaction_services_1.transactionServices.updateBalanceByAdminToSeller({
                    requesterId: adminId,
                    sellerId,
                    amount,
                    reason,
                    transactionType,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Balance Updated Successfully',
                    success: true,
                    data: transaction,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getIncomeStatisticsOfAUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const statistics = yield transaction_services_1.transactionServices.getIncomeStatisticsOfAUser(userId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Income statistics retrieved successfully',
                    success: true,
                    data: statistics,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.transactionControllers = new TransactionController();
