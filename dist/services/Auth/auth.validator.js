"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class AuthValidator {
    /**
     * Validation rules for sending OTP
     */
    static sendOtp() {
        return [
            (0, express_validator_1.body)('phoneNo')
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
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('otp')
                .notEmpty()
                .withMessage('OTP প্রয়োজন')
                .isNumeric()
                .withMessage('OTP অবশ্যই সংখ্যা হতে হবে')
                .isLength({ min: 4, max: 6 })
                .withMessage('OTP অবশ্যই ৪ থেকে ৬ ডিজিটের মধ্যে হতে হবে'),
        ];
    }
    /**
     * Validation rules for checking verification status
     */
    static checkVerification() {
        return [
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
        ];
    }
    /**
     * Validation rules for unblocking a contact
     */
    static unblockContact() {
        return [
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
        ];
    }
}
exports.default = AuthValidator;
