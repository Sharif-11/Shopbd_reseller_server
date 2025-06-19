"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
class WalletValidator {
    /**
     * Validation rules for sending OTP
     */
    static sendOtp() {
        return [
            (0, express_validator_1.body)('walletPhoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
        ];
    }
    /**
     * Validation rules for verifying OTP
     */
    static verifyOtp() {
        return [
            (0, express_validator_1.body)('otp')
                .notEmpty()
                .withMessage('OTP প্রয়োজন')
                .isString()
                .withMessage('OTP অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 6, max: 6 })
                .withMessage('OTP অবশ্যই ৬ ডিজিটের হতে হবে')
                .isNumeric()
                .withMessage('OTP অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('walletPhoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
        ];
    }
    /**
     * Validation rules for creating a wallet
     */
    static createWallet() {
        return [
            (0, express_validator_1.body)('walletName')
                .notEmpty()
                .withMessage('ওয়ালেটের নাম প্রয়োজন')
                .isString()
                .withMessage('ওয়ালেটের নাম অবশ্যই স্ট্রিং হতে হবে')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('ওয়ালেটের নাম অবশ্যই ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে'),
            (0, express_validator_1.body)('walletPhoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('walletType')
                .optional()
                .isIn(Object.values(client_1.WalletType))
                .withMessage('ওয়ালেটের ধরন সঠিক নয়'),
        ];
    }
    /**
     * Validation rules for updating a wallet
     */
    static updateWallet() {
        return [
            (0, express_validator_1.param)('walletId')
                .isInt()
                .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('walletName')
                .optional()
                .isString()
                .withMessage('ওয়ালেটের নাম অবশ্যই স্ট্রিং হতে হবে')
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('ওয়ালেটের নাম অবশ্যই ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে'),
            (0, express_validator_1.body)('walletPhoneNo')
                .optional()
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
        ];
    }
    /**
     * Validation rules for wallet ID parameter
     */
    static walletIdParam() {
        return [
            (0, express_validator_1.param)('walletId')
                .isInt()
                .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    /**
     * Validation rules for seller ID parameter
     */
    static sellerIdParam() {
        return [
            (0, express_validator_1.param)('sellerId')
                .isString()
                .withMessage('বিক্রেতা আইডি অবশ্যই স্ট্রিং হতে হবে')
                .notEmpty()
                .withMessage('বিক্রেতা আইডি প্রয়োজন'),
        ];
    }
    static phoneNoParam() {
        return [
            (0, express_validator_1.param)('phoneNo')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
        ];
    }
    /**
     * Validation rules for wallet verification
     */
    static verifyWallet() {
        return [
            (0, express_validator_1.param)('walletId')
                .isInt()
                .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('otp')
                .notEmpty()
                .withMessage('OTP প্রয়োজন')
                .isString()
                .withMessage('OTP অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 6, max: 6 })
                .withMessage('OTP অবশ্যই ৬ ডিজিটের হতে হবে')
                .isNumeric()
                .withMessage('OTP অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
}
exports.default = WalletValidator;
