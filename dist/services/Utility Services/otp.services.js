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
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const sms_services_1 = __importDefault(require("./Sms Service/sms.services"));
class OtpServices {
    /**
     * Send an OTP to a phone number with proper rate limiting and blocking
     * @param phoneNo - The phone number to send OTP to
     * @returns Object with OTP sending status and verification status
     */
    sendOtp(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validate phone number format first
            this.validatePhoneNumber(phoneNo);
            // Check if user already exists
            const user = yield prisma_1.default.user.findUnique({ where: { phoneNo } });
            if (user) {
                throw new ApiError_1.default(400, 'Phone number already registered with a user');
            }
            // Get or create OTP record
            let otpRecord = yield this.getOtpRecord(phoneNo);
            // Handle verified records
            if (otpRecord.isVerified) {
                return {
                    isVerified: true,
                    isBlocked: false,
                    sendOTP: false,
                    message: 'Phone number already verified',
                };
            }
            // Check if blocked temporarily
            if (this.isTemporarilyBlocked(otpRecord)) {
                const timeLeft = this.getRemainingBlockTime(otpRecord);
                throw new ApiError_1.default(403, `Too many OTP requests. Try again in ${timeLeft} seconds`);
            }
            // Check if permanently blocked
            if (otpRecord.isBlocked) {
                throw new ApiError_1.default(403, 'This phone number is permanently blocked from OTP requests');
            }
            // Check if there's a valid OTP already
            if (this.hasValidOtp(otpRecord)) {
                const timeLeft = this.getRemainingOtpTime(otpRecord);
                return {
                    sendOTP: false,
                    alreadySent: true,
                    isBlocked: false,
                    isVerified: false,
                    message: `OTP already sent. Please wait ${timeLeft} seconds before requesting a new one`,
                };
            }
            // Check if OTP request limit exceeded
            if (otpRecord.totalOTP >= config_1.default.maximumOtpRequests) {
                yield this.blockOtpRecord(phoneNo);
                throw new ApiError_1.default(403, 'Daily OTP request limit exceeded. Phone number blocked');
            }
            // Generate and send new OTP
            const otp = this.generateRandomOtp(config_1.default.otpLength);
            console.clear();
            console.log(`Generated OTP for ${phoneNo}: ${otp}`);
            yield sms_services_1.default.sendOtp(phoneNo, otp);
            const result = yield prisma_1.default.otp.update({
                where: { phoneNo },
                data: {
                    otp,
                    otpCreatedAt: new Date(),
                    otpExpiresAt: new Date(Date.now() + config_1.default.otpExpiresIn),
                    totalOTP: otpRecord.totalOTP + 1,
                    failedAttempts: 0,
                    updatedAt: new Date(),
                },
            });
            return {
                sendOTP: true,
                isBlocked: false,
                isVerified: false,
                message: 'OTP sent successfully',
            };
        });
    }
    /**
     * Verify an OTP for a phone number
     * @param phoneNo - Phone number to verify
     * @param otp - OTP code to verify
     * @returns Verification status
     */
    verifyOtp(phoneNo, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpRecord = yield this.getOtpRecord(phoneNo);
            // Handle already verified numbers
            if (otpRecord.isVerified) {
                return {
                    alreadyVerified: true,
                    isBlocked: false,
                    message: 'Phone number already verified',
                };
            }
            // Check if temporarily blocked due to failed attempts
            if (this.isTemporarilyBlocked(otpRecord)) {
                const timeLeft = this.getRemainingBlockTime(otpRecord);
                throw new ApiError_1.default(403, `Too many failed attempts. Try again in ${timeLeft} seconds`);
            }
            // Check if permanently blocked
            if (otpRecord.isBlocked) {
                throw new ApiError_1.default(403, 'This phone number is blocked from verification');
            }
            // Validate OTP presence and expiration
            if (!otpRecord.otp || !otpRecord.otpCreatedAt || !otpRecord.otpExpiresAt) {
                throw new ApiError_1.default(400, 'No valid OTP found. Please request a new OTP');
            }
            if (new Date() > otpRecord.otpExpiresAt) {
                throw new ApiError_1.default(400, 'OTP has expired. Please request a new OTP');
            }
            // Verify OTP
            if (otpRecord.otp !== otp) {
                // Increment failed attempts
                const updatedRecord = yield this.updateOtpRecord(phoneNo, Object.assign({ failedAttempts: otpRecord.failedAttempts + 1 }, (otpRecord.failedAttempts + 1 >= config_1.default.maximumOtpAttempts
                    ? {
                        otpBlockUntil: new Date(Date.now() + config_1.default.otpBlockDuration),
                    }
                    : {})));
                if (updatedRecord.failedAttempts >= config_1.default.maximumOtpAttempts) {
                    throw new ApiError_1.default(403, `Too many failed attempts. Try again in ${config_1.default.otpBlockDuration / 1000} seconds`);
                }
                throw new ApiError_1.default(400, 'Invalid OTP');
            }
            // Mark as verified
            yield this.updateOtpRecord(phoneNo, {
                isVerified: true,
                failedAttempts: 0,
                otpBlockUntil: null,
            });
            return {
                otpVerified: true,
                isBlocked: false,
                message: 'Phone number verified successfully',
            };
        });
    }
    /**
     * Check if a contact is verified
     * @param phoneNo - Phone number to check
     * @returns Verification status
     */
    isVerified(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpRecord = yield this.getOtpRecord(phoneNo);
            return {
                isVerified: otpRecord.isVerified,
                isBlocked: otpRecord.isBlocked,
            };
        });
    }
    /**
     * Unblock a contact
     * @param phoneNo - Phone number to unblock
     * @returns Unblock status
     */
    unblockContact(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpRecord = yield this.getOtpRecord(phoneNo);
            if (!otpRecord.isBlocked && !otpRecord.otpBlockUntil) {
                return {
                    isUnblocked: false,
                    message: 'Contact is not blocked',
                };
            }
            yield this.updateOtpRecord(phoneNo, {
                isBlocked: false,
                otpBlockUntil: null,
                failedAttempts: 0,
            });
            return {
                isUnblocked: true,
                message: 'Contact unblocked successfully',
            };
        });
    }
    // ========== PRIVATE HELPER METHODS ========== //
    /**
     * Get OTP record for a phone number, create if doesn't exist
     * @param phoneNo - Phone number
     * @returns OTP record
     */
    getOtpRecord(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            let otpRecord = yield prisma_1.default.otp.findUnique({ where: { phoneNo } });
            if (!otpRecord) {
                otpRecord = yield prisma_1.default.otp.create({
                    data: {
                        phoneNo,
                        otp: '',
                        isVerified: false,
                        isBlocked: false,
                        totalOTP: 0,
                        failedAttempts: 0,
                        otpBlockUntil: null,
                        otpCreatedAt: new Date(),
                        otpExpiresAt: new Date(Date.now() + config_1.default.otpExpiresIn),
                    },
                });
            }
            return otpRecord;
        });
    }
    /**
     * Update OTP record
     * @param phoneNo - Phone number
     * @param data - Data to update
     * @returns Updated record
     */
    updateOtpRecord(phoneNo, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.otp.update({
                where: { phoneNo },
                data: Object.assign(Object.assign({}, data), { updatedAt: new Date() }),
            });
        });
    }
    /**
     * Block an OTP record permanently
     * @param phoneNo - Phone number to block
     */
    blockOtpRecord(phoneNo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateOtpRecord(phoneNo, {
                isBlocked: true,
                otpBlockUntil: null,
            });
        });
    }
    /**
     * Check if record has a valid (unexpired) OTP
     * @param otpRecord - OTP record
     * @returns Boolean indicating valid OTP presence
     */
    hasValidOtp(otpRecord) {
        return (otpRecord.otp &&
            otpRecord.otpCreatedAt &&
            new Date() <
                new Date(otpRecord.otpCreatedAt.getTime() + config_1.default.otpExpiresIn));
    }
    /**
     * Check if record is temporarily blocked
     * @param otpRecord - OTP record
     * @returns Boolean indicating temporary block status
     */
    isTemporarilyBlocked(otpRecord) {
        return otpRecord.otpBlockUntil && new Date() < otpRecord.otpBlockUntil;
    }
    /**
     * Get remaining time for temporary block
     * @param otpRecord - OTP record
     * @returns Remaining time in seconds
     */
    getRemainingBlockTime(otpRecord) {
        if (!otpRecord.otpBlockUntil)
            return 0;
        return Math.ceil((otpRecord.otpBlockUntil.getTime() - Date.now()) / 1000);
    }
    /**
     * Get remaining time for current OTP
     * @param otpRecord - OTP record
     * @returns Remaining time in seconds
     */
    getRemainingOtpTime(otpRecord) {
        if (!otpRecord.otpCreatedAt)
            return 0;
        const expiresAt = otpRecord.otpCreatedAt.getTime() + config_1.default.otpExpiresIn;
        return Math.ceil((expiresAt - Date.now()) / 1000);
    }
    /**
     * Generate a random OTP
     * @returns Random OTP string
     */
    generateRandomOtp(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }
    validatePhoneNumber(phoneNo) {
        // phone no validation logic for Bangladesh
        const phoneRegex = /^(\+8801[3-9]\d{8}|01[3-9]\d{8})$/;
        if (!phoneRegex.test(phoneNo)) {
            throw new ApiError_1.default(400, 'Invalid phone number format');
        }
        return true;
    }
}
exports.default = new OtpServices();
