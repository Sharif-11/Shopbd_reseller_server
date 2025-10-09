"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
class PaymentValidator {
    /**
     * Validation rules for creating a payment
     */
    static createPayment() {
        return [
            (0, express_validator_1.body)('paymentType')
                .notEmpty()
                .withMessage('পেমেন্টের ধরন প্রয়োজন')
                .isIn(Object.values(client_1.PaymentType))
                .withMessage('পেমেন্টের ধরন সঠিক নয়'),
            (0, express_validator_1.body)('sender')
                .notEmpty()
                .withMessage('প্রেরকের ধরন প্রয়োজন')
                .isIn(Object.values(client_1.SenderType))
                .withMessage('প্রেরকের ধরন সঠিক নয়'),
            (0, express_validator_1.body)('userWalletName')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ওয়ালেট নাম প্রয়োজন')
                .isString()
                .withMessage('ব্যবহারকারীর ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('userWalletPhoneNo')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),
            (0, express_validator_1.body)('systemWalletPhoneNo')
                .notEmpty()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),
            (0, express_validator_1.body)('amount')
                .notEmpty()
                .withMessage('পরিমাণ প্রয়োজন')
                .isNumeric()
                .withMessage('পরিমাণ অবশ্যই সংখ্যা হতে হবে')
                .isFloat({ gt: 0 })
                .withMessage('পরিমাণ অবশ্যই ০ এর চেয়ে বড় হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .notEmpty()
                .withMessage('লেনদেন আইডি প্রয়োজন')
                .isString()
                .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    /**
     * Validation rules for creating a withdrawal payment
     */
    static createWithdrawPayment() {
        return [
            (0, express_validator_1.body)('amount')
                .notEmpty()
                .withMessage('পরিমাণ প্রয়োজন')
                .isNumeric()
                .withMessage('পরিমাণ অবশ্যই সংখ্যা হতে হবে')
                .isFloat({ gt: 0 })
                .withMessage('পরিমাণ অবশ্যই ০ এর চেয়ে বড় হতে হবে'),
            (0, express_validator_1.body)('transactionFee')
                .notEmpty()
                .withMessage('লেনদেন ফি প্রয়োজন')
                .isNumeric()
                .withMessage('লেনদেন ফি অবশ্যই সংখ্যা হতে হবে')
                .isFloat({ min: 0 })
                .withMessage('লেনদেন ফি অবশ্যই ০ বা তার চেয়ে বড় হতে হবে'),
            (0, express_validator_1.body)('systemWalletPhoneNo')
                .notEmpty()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),
            (0, express_validator_1.body)('systemWalletName')
                .notEmpty()
                .withMessage('সিস্টেম ওয়ালেট নাম প্রয়োজন')
                .isString()
                .withMessage('সিস্টেম ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .notEmpty()
                .withMessage('লেনদেন আইডি প্রয়োজন')
                .isString()
                .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('userWalletName')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ওয়ালেট নাম প্রয়োজন')
                .isString()
                .withMessage('ব্যবহারকারীর ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('userWalletPhoneNo')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),
        ];
    }
    /**
     * Validation rules for verifying a payment by admin
     */
    static verifyPaymentByAdmin() {
        return [
            (0, express_validator_1.param)('paymentId')
                .notEmpty()
                .withMessage('পেমেন্ট আইডি প্রয়োজন')
                .isString()
                .withMessage('পেমেন্ট আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .notEmpty()
                .withMessage('লেনদেন আইডি প্রয়োজন')
                .isString()
                .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    /**
     * Validation rules for rejecting a payment by admin
     */
    static rejectPaymentByAdmin() {
        return [
            (0, express_validator_1.param)('paymentId')
                .notEmpty()
                .withMessage('পেমেন্ট আইডি প্রয়োজন')
                .isString()
                .withMessage('পেমেন্ট আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('remarks')
                .notEmpty()
                .withMessage('মন্তব্য প্রয়োজন')
                .isString()
                .withMessage('মন্তব্য অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 5 })
                .withMessage('মন্তব্য অবশ্যই ৫ অক্ষরের বেশি হতে হবে'),
        ];
    }
    /**
     * Validation rules for getting all payments of a user
     */
    static getAllPaymentsOfAUser() {
        return [
            (0, express_validator_1.param)('userPhoneNo')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),
            (0, express_validator_1.query)('paymentStatus')
                .optional()
                .isIn(Object.values(client_1.PaymentStatus))
                .withMessage('পেমেন্ট অবস্থা সঠিক নয়'),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ বা তার বেশি হতে হবে'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে'),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    static payDueBySeller() {
        return [
            (0, express_validator_1.body)('amount')
                .notEmpty()
                .withMessage('পরিমাণ প্রয়োজন')
                .isNumeric()
                .withMessage('পরিমাণ অবশ্যই সংখ্যা হতে হবে')
                .isFloat({ gt: 0 })
                .withMessage('পরিমাণ অবশ্যই ০ এর চেয়ে বড় হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .notEmpty()
                .withMessage('লেনদেন আইডি প্রয়োজন')
                .isString()
                .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('systemWalletPhoneNo')
                .notEmpty()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর অবশ্যই ১১')
                .isString()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('walletName')
                .notEmpty()
                .withMessage('ওয়ালেট নাম প্রয়োজন')
                .isString()
                .withMessage('ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('walletPhoneNo')
                .notEmpty()
                .withMessage('ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ওয়ালেট ফোন নম্বর অবশ্যই ১১')
                .isString()
                .withMessage('ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    /**
     * Validation rules for getting all payments for admin
     */
    static getAllPaymentsForAdmin() {
        return [
            (0, express_validator_1.query)('paymentStatus')
                .optional()
                .isIn(Object.values(client_1.PaymentStatus))
                .withMessage('পেমেন্ট অবস্থা সঠিক নয়'),
            (0, express_validator_1.query)('transactionId')
                .optional()
                .isString()
                .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ বা তার বেশি হতে হবে'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে'),
        ];
    }
    static getPaymentByIdForAdmin() {
        return [
            (0, express_validator_1.param)('paymentId')
                .notEmpty()
                .withMessage('পেমেন্ট আইডি প্রয়োজন')
                .isString()
                .withMessage('পেমেন্ট আইডি অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
}
exports.default = PaymentValidator;
