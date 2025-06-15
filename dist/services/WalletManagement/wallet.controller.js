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
const wallet_services_1 = __importDefault(require("./wallet.services"));
class WalletController {
    /**
     * Create a new wallet
     */
    createWallet(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { walletName, walletPhoneNo, walletType = 'SELLER' } = req.body;
                const creatorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // From auth middleware
                const wallet = yield wallet_services_1.default.createWallet(creatorId, {
                    walletName,
                    walletPhoneNo,
                    walletType,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Wallet created successfully',
                    success: true,
                    data: wallet,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get all system wallets (SuperAdmin only)
     */
    getSystemWallets(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const wallets = yield wallet_services_1.default.getAllSystemWallets(requesterId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'System wallets retrieved successfully',
                    success: true,
                    data: wallets,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get wallets for a specific seller
     */
    getSellerWallets(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { sellerId } = req.params;
                const wallets = yield wallet_services_1.default.getSellerWallets(requesterId, sellerId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Seller wallets retrieved successfully',
                    success: true,
                    data: wallets,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get wallet by ID
     */
    getWallet(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletId } = req.params;
                const wallet = yield wallet_services_1.default.getWalletById(requesterId, parseInt(walletId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Wallet retrieved successfully',
                    success: true,
                    data: wallet,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Update wallet information
     */
    updateWallet(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const updaterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletId } = req.params;
                const { walletName, walletPhoneNo } = req.body;
                const wallet = yield wallet_services_1.default.updateWallet(updaterId, parseInt(walletId), { walletName, walletPhoneNo });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Wallet updated successfully',
                    success: true,
                    data: wallet,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Delete a wallet
     */
    deleteWallet(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const deleterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletId } = req.params;
                const wallet = yield wallet_services_1.default.deleteWallet(deleterId, parseInt(walletId));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Wallet deleted successfully',
                    success: true,
                    data: wallet,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Initiate wallet verification OTP
     */
    initiateVerification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletPhoneNo } = req.body;
                const result = yield wallet_services_1.default.initiateVerification(requesterId, walletPhoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: result.sendOTP
                        ? 'OTP sent successfully'
                        : result.message || 'Verification initiated',
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
     * Verify wallet with OTP
     */
    verifyWallet(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletPhoneNo, otp } = req.body;
                const result = yield wallet_services_1.default.verifyWallet(requesterId, walletPhoneNo, otp);
                res.status(200).json({
                    statusCode: 200,
                    message: result.isVerified || result.alreadyVerified
                        ? 'Wallet verified successfully'
                        : 'Verification failed',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    resetWalletVerification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requesterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { walletPhoneNo } = req.params;
                const result = yield wallet_services_1.default.resetWalletVerification(requesterId, walletPhoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Wallet verification reset successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new WalletController();
