"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({
    path: path_1.default.join(process.cwd(), '.env'),
});
const config = {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    database_url: process.env.DATABASE_URL,
    saltRounds: process.env.SALT_ROUNDS || '10',
    jwtSecret: process.env.JWT_SECRET,
    otpLength: 6,
    otpExpiresIn: 5 * 60 * 1000, // 5 minutes
    otpBlockDuration: 60 * 1000, // 1 minute
    apiKey: 'hsYr6qwobYaKBZdh8xXJ',
    senderId: '8809617623563',
    smsUrl: 'http://bulksmsbd.net/api/smsapi',
    maximumOtpAttempts: 5,
    maximumOtpRequests: 5,
    nodeEnv: process.env.NODE_ENV || 'development',
    smsCharge: 1,
    maxForgotPasswordAttempts: 3,
    maximumWallets: 2,
    maximumWithdrawAmount: 10000,
    deliveryChargeInsideDhaka: 80,
    deliveryChargeOutsideDhaka: 130,
    negativeBalanceLimit: -10,
    minimumOrderCompletedToBeVerified: 1,
    forgotPasswordRequestInterval: 5 * 60 * 1000, // 5 minutes
    defaultSellerPermissions: [],
    defaultAdminPermissions: [
        client_1.PermissionType.WALLET_MANAGEMENT,
        client_1.PermissionType.ORDER_MANAGEMENT,
        client_1.PermissionType.PAYMENT_MANAGEMENT,
    ],
    ftpHost: process.env.FTP_HOST || '',
    ftpUser: process.env.FTP_USER || '',
    ftpPassword: process.env.FTP_PASSWORD || '',
    ftpBaseUrl: process.env.FTP_BASE_URL || '',
    maxRejectedPaymentLimit: 3,
    // cloudinaryKey: process.env.CLOUDINARY_KEY,
    // cloudinarySecret: process.env.CLOUDINARY_SECRET,
    // cloudinaryName: process.env.CLOUDINARY_NAME,
};
exports.default = config;
