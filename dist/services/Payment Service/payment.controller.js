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
const payment_service_1 = __importDefault(require("./payment.service"));
class PaymentController {
    /**
     * Create a payment
     */
    // async createPayment(req: Request, res: Response, next: NextFunction) {
    //   try {
    //     const {
    //       paymentType,
    //       sender,
    //       userWalletName,
    //       userWalletPhoneNo,
    //       systemWalletPhoneNo,
    //       amount,
    //       transactionId,
    //     } = req.body
    //     const userPhoneNo = req.user?.phoneNo
    //     const userName = req.user?.name
    //     if (!userPhoneNo || !userName) {
    //       throw new Error('User information not found in request')
    //     }
    //     const payment = await paymentServices.createPayment({
    //       paymentType,
    //       sender,
    //       userWalletName,
    //       userWalletPhoneNo,
    //       systemWalletPhoneNo,
    //       amount,
    //       transactionId,
    //       userName,
    //       userPhoneNo,
    //     })
    //     res.status(201).json({
    //       statusCode: 201,
    //       message: 'Payment created successfully',
    //       success: true,
    //       data: payment,
    //     })
    //   } catch (error) {
    //     next(error)
    //   }
    // }
    /**
     * Create a withdrawal payment
     */
    // async createWithdrawPayment(req: Request, res: Response, next: NextFunction) {
    //   try {
    //     const {
    //       amount,
    //       transactionFee,
    //       systemWalletPhoneNo,
    //       systemWalletName,
    //       transactionId,
    //       userWalletName,
    //       userWalletPhoneNo,
    //     } = req.body
    //     const userPhoneNo = req.user?.phoneNo
    //     const userName = req.user?.name
    //     if (!userPhoneNo || !userName) {
    //       throw new Error('User information not found in request')
    //     }
    //     const payment = await paymentServices.createWithdrawPayment({
    //       userName,
    //       userPhoneNo,
    //       amount,
    //       transactionFee,
    //       systemWalletPhoneNo,
    //       systemWalletName,
    //       transactionId,
    //       userWalletName,
    //       userWalletPhoneNo,
    //     })
    //     res.status(201).json({
    //       statusCode: 201,
    //       message: 'Withdrawal payment created successfully',
    //       success: true,
    //       data: payment,
    //     })
    //   } catch (error) {
    //     next(error)
    //   }
    // }
    /**
     * Verify a payment by admin
     */
    verifyPaymentByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { paymentId } = req.params;
                const { transactionId } = req.body;
                const payment = yield payment_service_1.default.verifyPaymentByAdmin({
                    adminId: adminId,
                    paymentId,
                    transactionId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Payment verified successfully',
                    success: true,
                    data: payment,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Reject a payment by admin
     */
    rejectPaymentByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { paymentId } = req.params;
                const { remarks } = req.body;
                const payment = yield payment_service_1.default.rejectPaymentByAdmin({
                    adminId: adminId,
                    paymentId,
                    remarks,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Payment rejected successfully',
                    success: true,
                    data: payment,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all payments of a user
     */
    getAllPaymentsOfAUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userPhoneNo } = req.params;
                const { paymentStatus, page, limit, search } = req.query;
                const result = yield payment_service_1.default.getAllPaymentsOfAUser({
                    userPhoneNo,
                    paymentStatus: paymentStatus,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Payments retrieved successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all payments for admin
     */
    getAllPaymentsForAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { paymentStatus, search, transactionId, page, limit } = req.query;
                const result = yield payment_service_1.default.getAllPaymentsForAdmin({
                    adminId: adminId,
                    paymentStatus: paymentStatus,
                    search: search,
                    transactionId: transactionId,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Payments retrieved successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    createDuePayment(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletName, walletPhoneNo, amount, transactionId, systemWalletPhoneNo, } = req.body;
                const payment = yield payment_service_1.default.createDuePayment({
                    userId: userId,
                    walletName,
                    walletPhoneNo,
                    amount,
                    transactionId,
                    systemWalletPhoneNo,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Due payment created successfully',
                    success: true,
                    data: payment,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new PaymentController();
