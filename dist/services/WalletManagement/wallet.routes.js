"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middlewares_1 = require("../../middlewares/auth.middlewares");
const validation_middleware_1 = __importDefault(require("../../middlewares/validation.middleware"));
const wallet_controller_1 = __importDefault(require("./wallet.controller"));
const wallet_validator_1 = __importDefault(require("./wallet.validator"));
class WalletRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Wallet CRUD routes
        this.router.post('/', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.createWallet(), validation_middleware_1.default, wallet_controller_1.default.createWallet);
        this.router.get('/system', auth_middlewares_1.isAuthenticated, wallet_controller_1.default.getSystemWallets);
        this.router.get('/seller/:sellerId', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.sellerIdParam(), validation_middleware_1.default, wallet_controller_1.default.getSellerWallets);
        this.router.get('/:walletId', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.walletIdParam(), validation_middleware_1.default, wallet_controller_1.default.getWallet);
        this.router.patch('/:walletId', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.updateWallet(), validation_middleware_1.default, wallet_controller_1.default.updateWallet);
        this.router.delete('/:walletId', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.walletIdParam(), validation_middleware_1.default, wallet_controller_1.default.deleteWallet);
        // Wallet verification routes
        this.router.post('/:walletId/verify', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.walletIdParam(), validation_middleware_1.default, wallet_controller_1.default.initiateVerification);
        this.router.post('/:walletId/verify/confirm', auth_middlewares_1.isAuthenticated, wallet_validator_1.default.verifyWallet(), validation_middleware_1.default, wallet_controller_1.default.verifyWallet);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new WalletRouter().getRouter();
