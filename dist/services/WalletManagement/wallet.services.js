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
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
class WalletServices {
    /**
     * Generate Random Otp
     */
    generateRandomOtp(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }
    // ==========================================
    // WALLET CREATION
    // ==========================================
    /**
     * Check duplicate wallet with name and phone number
     * @param walletName - Name of the wallet
     *  @param walletPhoneNo - Phone number associated with the wallet
     * @returns - Promise resolving to boolean indicating if duplicate exists
     */
    isDuplicateWallet(walletName, walletPhoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingWallet = yield prisma_1.default.wallet.findFirst({
                where: {
                    walletName,
                    walletPhoneNo,
                },
            });
            if (existingWallet) {
                throw new ApiError_1.default(400, `Wallet already exists`);
            }
            return !!existingWallet;
        });
    }
    createWallet(creatorId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if creator is blocked
            const user = yield user_services_1.default.getUserById(creatorId);
            const isBlocked = yield user_services_1.default.isUserBlocked(user.phoneNo, client_1.BlockActionType.WALLET_ADDITION);
            if (isBlocked) {
                throw new ApiError_1.default(403, 'User is blocked from adding wallets');
            }
            yield this.isDuplicateWallet(input.walletName, input.walletPhoneNo);
            // SYSTEM wallet specific logic
            if (input.walletType === 'SYSTEM') {
                // Only SuperAdmin can create system wallets
                yield user_services_1.default.verifyUserRole(creatorId, client_1.UserType.SuperAdmin);
                // Check for duplicate system wallet name or phone combination
                return yield prisma_1.default.wallet.create({
                    data: {
                        walletName: input.walletName,
                        walletPhoneNo: input.walletPhoneNo,
                        walletType: 'SYSTEM',
                    },
                });
            }
            // SELLER wallet logic
            // Verify creator has permission to create wallets
            yield user_services_1.default.verifyUserPermission(creatorId, client_1.PermissionType.WALLET_ADDITION, 'CREATE');
            if (!user || user.role !== 'Seller') {
                throw new ApiError_1.default(400, 'Wallets can only be created for sellers');
            }
            if (user.Wallet.length >= config_1.default.maximumWallets) {
                throw new ApiError_1.default(400, `Seller can have maximum ${config_1.default.maximumWallets} wallets`);
            }
            // Check verification status of wallet phone number
            if (user.phoneNo !== input.walletPhoneNo) {
                const walletOtp = yield prisma_1.default.walletOtp.findUnique({
                    where: { phoneNo: input.walletPhoneNo },
                });
                if (!walletOtp || !walletOtp.isVerified) {
                    throw new ApiError_1.default(400, 'Wallet phone number must be verified before creating a wallet');
                }
            }
            return yield prisma_1.default.wallet.create({
                data: {
                    walletName: input.walletName,
                    walletPhoneNo: input.walletPhoneNo,
                    walletType: 'SELLER',
                    userId: creatorId, // Associate with the seller
                },
            });
        });
    }
    // ==========================================
    // WALLET FETCHING
    // ==========================================
    /**
     * Get all system wallets (for SuperAdmin)
     */
    getAllSystemWallets(requesterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.wallet.findMany({
                where: { walletType: 'SYSTEM' },
            });
        });
    }
    /**
     * Get wallets for a specific seller
     */
    getSellerWallets(requesterId, sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Admin/SuperAdmin can view any seller's wallets
            try {
                yield user_services_1.default.verifyUserRole(requesterId, client_1.UserType.Admin || client_1.UserType.SuperAdmin || client_1.UserType.Seller);
                // verify if requester is allowed to view seller's wallets
                yield user_services_1.default.verifyUserPermission(requesterId, 'WALLET_MANAGEMENT', 'READ');
            }
            catch (_a) {
                // Regular users can only view their own wallets
                if (requesterId !== sellerId) {
                    throw new ApiError_1.default(403, 'Unauthorized to view these wallets');
                }
            }
            return yield prisma_1.default.wallet.findMany({
                where: { userId: sellerId, walletType: 'SELLER' },
            });
        });
    }
    /**
     * Get wallet by ID with permission check
     */
    getWalletById(requesterId, walletId) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield prisma_1.default.wallet.findUnique({
                where: { walletId },
            });
            if (!wallet) {
                throw new ApiError_1.default(404, 'Wallet not found');
            }
            // System wallets only visible to SuperAdmin
            if (wallet.walletType === 'SYSTEM') {
                yield user_services_1.default.verifyUserRole(requesterId, client_1.UserType.SuperAdmin);
                return wallet;
            }
            // Check if requester owns the wallet or has admin privileges
            if (wallet.userId !== requesterId) {
                yield user_services_1.default.verifyUserPermission(requesterId, 'WALLET_MANAGEMENT', 'READ');
            }
            return wallet;
        });
    }
    // ==========================================
    // WALLET MODIFICATION
    // ==========================================
    /**
     * Update wallet information
     */
    updateWallet(updaterId, walletId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield this.getWalletById(updaterId, walletId);
            // System wallets can only be updated by SuperAdmin
            if (wallet.walletType === 'SYSTEM') {
                yield user_services_1.default.verifyUserRole(updaterId, client_1.UserType.SuperAdmin);
            }
            else {
                // For seller wallets, verify update permission
                yield user_services_1.default.verifyUserPermission(updaterId, 'WALLET_MANAGEMENT', 'UPDATE');
            }
            return yield prisma_1.default.wallet.update({
                where: { walletId },
                data: updates,
            });
        });
    }
    /**
     * Delete a wallet (admin can delete seller wallets, SuperAdmin can delete any)
     */
    deleteWallet(deleterId, walletId) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield this.getWalletById(deleterId, walletId);
            // System wallets can only be deleted by SuperAdmin
            if (wallet.walletType === 'SYSTEM') {
                yield user_services_1.default.verifyUserRole(deleterId, client_1.UserType.SuperAdmin);
            }
            else {
                // For seller wallets, verify delete permission
                yield user_services_1.default.verifyUserPermission(deleterId, 'WALLET_MANAGEMENT', 'DELETE');
            }
            return yield prisma_1.default.wallet.delete({
                where: { walletId },
            });
        });
    }
    // ==========================================
    // WALLET VERIFICATION (SELLER WALLETS ONLY)
    // ==========================================
    /**
     * Initiate OTP verification for seller wallet
     */
    initiateVerification(requesterId, walletPhoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            // check is there any existing wallet with this phone number
            const otpRecord = yield prisma_1.default.walletOtp.findUnique({
                where: { phoneNo: walletPhoneNo },
            });
            if (otpRecord && otpRecord.isVerified) {
                return { alreadyVerified: true };
            }
            // Check if requester is alowed to create wallets
            yield user_services_1.default.verifyUserPermission(requesterId, 'WALLET_ADDITION', 'CREATE');
            // check if otp already exists and valid
            if (otpRecord && otpRecord.otpExpiresAt > new Date()) {
                return {
                    sendOTP: false,
                    isBlocked: otpRecord.isBlocked,
                    isVerified: otpRecord.isVerified,
                    message: 'OTP already sent',
                };
            }
            // check totalOtp exceeds limit
            if (otpRecord && otpRecord.totalOTP >= config_1.default.maximumOtpRequests) {
                throw new ApiError_1.default(403, 'Maximum OTP requests exceeded for this wallet');
            }
            // Generate and send OTP
            const otp = this.generateRandomOtp();
            const otpExpiresAt = new Date(Date.now() + config_1.default.otpExpiresIn);
            const newOtpRecord = {
                phoneNo: walletPhoneNo,
                otp,
                otpExpiresAt,
                otpCreatedAt: new Date(), // Add the required otpCreatedAt field
                totalOTP: ((otpRecord === null || otpRecord === void 0 ? void 0 : otpRecord.totalOTP) || 0) + 1,
                failedAttempts: 0,
                isBlocked: false,
                isVerified: false,
            };
            // Create or update OTP record
            yield prisma_1.default.walletOtp.upsert({
                where: { phoneNo: walletPhoneNo },
                update: newOtpRecord,
                create: newOtpRecord,
            });
            // await SmsServices.sendOtp(wallet.walletPhoneNo, otp)
            return {
                sendOTP: true,
                isBlocked: false,
                isVerified: (otpRecord === null || otpRecord === void 0 ? void 0 : otpRecord.isVerified) || false,
                message: 'OTP sent successfully',
            };
        });
    }
    /**
     * Verify OTP for seller wallet
     */
    verifyWallet(requesterId, walletPhoneNo, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpRecord = yield prisma_1.default.walletOtp.findUnique({
                where: { phoneNo: walletPhoneNo },
            });
            if (!otpRecord) {
                throw new ApiError_1.default(400, 'OTP not requested for this wallet');
            }
            if (otpRecord.isVerified) {
                return {
                    alreadyVerified: true,
                };
            }
            if (otpRecord.isBlocked) {
                throw new ApiError_1.default(403, 'Wallet verification is blocked due to too many attempts');
            }
            if (!otpRecord.otp || !otpRecord.otpExpiresAt) {
                throw new ApiError_1.default(400, 'OTP not properly initialized');
            }
            if (new Date() > otpRecord.otpExpiresAt) {
                throw new ApiError_1.default(400, 'OTP has expired');
            }
            if (otpRecord.otp !== otp) {
                // Increment failed attempts and block if too many
                const updatedRecord = yield prisma_1.default.walletOtp.update({
                    where: { phoneNo: walletPhoneNo },
                    data: {
                        failedAttempts: { increment: 1 },
                        isBlocked: otpRecord.failedAttempts + 1 >= config_1.default.maximumOtpAttempts,
                    },
                });
                if (updatedRecord.isBlocked) {
                    throw new ApiError_1.default(403, 'Too many failed attempts. Wallet verification blocked.');
                }
                throw new ApiError_1.default(400, 'Invalid OTP');
            }
            // Mark as verified
            yield prisma_1.default.walletOtp.update({
                where: { phoneNo: walletPhoneNo },
                data: { isVerified: true },
            });
            return { isVerified: true, message: 'Wallet verified successfully' };
        });
    }
    /**
     * Reset Seller Wallet Verification by Admin
     * @param adminId - ID of the admin performing the reset
     * @param walletId - ID of the wallet to reset
     */
    resetWalletVerification(adminId, walletPhoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify admin role
            yield user_services_1.default.verifyUserRole(adminId, client_1.UserType.Admin || client_1.UserType.SuperAdmin);
            // verify permission
            yield user_services_1.default.verifyUserPermission(adminId, 'WALLET_MANAGEMENT', 'UPDATE');
            // Reset wallet verification
            yield prisma_1.default.walletOtp.update({
                where: { phoneNo: walletPhoneNo },
                data: {
                    isVerified: false,
                    failedAttempts: 0,
                    totalOTP: 0,
                    isBlocked: false,
                },
            });
            return { message: 'Wallet verification reset successfully' };
        });
    }
}
exports.default = new WalletServices();
