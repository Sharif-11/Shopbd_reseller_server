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
const otp_services_1 = __importDefault(require("../otp/otp.services"));
class AuthController {
    /**
     * Send OTP to a phone number
     */
    sendOtp(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo } = req.body;
                const data = yield otp_services_1.default.sendOtp(phoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: data.isVerified
                        ? 'এই নম্বরটি ইতিমধ্যে যাচাই করা হয়েছে'
                        : data.sendOTP
                            ? 'OTP সফলভাবে পাঠানো হয়েছে'
                            : data.message || 'OTP request processed',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Verify OTP for phone number verification
     */
    verifyOtp(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo, otp } = req.body;
                const data = yield otp_services_1.default.verifyOtp(phoneNo, otp);
                res.status(200).json({
                    statusCode: 200,
                    message: data.alreadyVerified
                        ? 'এই নম্বরটি ইতিমধ্যে যাচাই করা হয়েছে'
                        : 'OTP সফলভাবে যাচাই করা হয়েছে',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Check if a phone number is verified
     */
    checkVerification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo } = req.body;
                const data = yield otp_services_1.default.isVerified(phoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: data.isVerified
                        ? 'এই নম্বরটি যাচাই করা হয়েছে'
                        : 'এই নম্বরটি যাচাই করা হয়নি',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Unblock a phone number
     */
    unblockContact(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { phoneNo } = req.body;
                const data = yield otp_services_1.default.unblockContact(phoneNo);
                res.status(200).json({
                    statusCode: 200,
                    message: data.isUnblocked
                        ? 'ফোন নম্বরটি আনব্লক করা হয়েছে'
                        : data.message || 'Unblock request processed',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new AuthController();
