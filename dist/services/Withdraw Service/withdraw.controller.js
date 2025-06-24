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
const withdraw_services_1 = require("./withdraw.services");
class WithdrawController {
    /**
     * Create a new withdraw request
     */
    createWithdraw(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { amount, walletName, walletPhoneNo } = req.body;
                const withdraw = yield withdraw_services_1.withdrawService.createWithdraw({
                    userId: userId,
                    amount,
                    walletName,
                    walletPhoneNo,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Withdraw request created successfully',
                    success: true,
                    data: withdraw,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Cancel a withdraw request
     */
    cancelWithdraw(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { withdrawId } = req.params;
                const withdraw = yield withdraw_services_1.withdrawService.cancelWithdraw({
                    userId: userId,
                    withdrawId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdraw request cancelled successfully',
                    success: true,
                    data: withdraw,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Approve a withdraw request (Admin)
     */
    approveWithdraw(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { withdrawId } = req.params;
                const { systemWalletPhoneNo, transactionId } = req.body;
                const withdraw = yield withdraw_services_1.withdrawService.approveWithdraw({
                    adminId: adminId,
                    withdrawId,
                    systemWalletPhoneNo,
                    transactionId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdraw request approved successfully',
                    success: true,
                    data: withdraw,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Reject a withdraw request (Admin)
     */
    rejectWithdraw(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { withdrawId } = req.params;
                const { remarks } = req.body;
                const withdraw = yield withdraw_services_1.withdrawService.rejectWithdraw({
                    adminId: adminId,
                    withdrawId,
                    remarks,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdraw request rejected successfully',
                    success: true,
                    data: withdraw,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get withdraw requests for seller
     */
    getWithdrawsForSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const sellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit, search, status } = req.query;
                // Convert status to array if it's a string
                let statusArray;
                if (typeof status === 'string') {
                    statusArray = [status];
                }
                else if (Array.isArray(status)) {
                    statusArray = status;
                }
                const withdraws = yield withdraw_services_1.withdrawService.getWithdrawForSeller({
                    sellerId: sellerId,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                    status: statusArray,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdraw requests retrieved successfully',
                    success: true,
                    data: withdraws,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get withdraw requests for admin
     */
    getWithdrawsForAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit, search, status } = req.query;
                // Convert status to array if it's a string
                let statusArray;
                if (typeof status === 'string') {
                    statusArray = [status];
                }
                else if (Array.isArray(status)) {
                    statusArray = status;
                }
                const withdraws = yield withdraw_services_1.withdrawService.getWithdrawForAdmin({
                    adminId: adminId,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                    status: statusArray,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdraw requests retrieved successfully',
                    success: true,
                    data: withdraws,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get withdraw request details
     */
    getWithdrawDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { withdrawId } = req.params;
                const withdraw = yield withdraw_services_1.withdrawService.getWithdrawById(withdrawId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdraw request details retrieved successfully',
                    success: true,
                    data: withdraw,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new WithdrawController();
