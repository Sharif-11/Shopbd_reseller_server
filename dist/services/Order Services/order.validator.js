"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class OrderValidator {
    static createSellerOrder() {
        return [
            (0, express_validator_1.body)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('customerName')
                .notEmpty()
                .withMessage('গ্রাহকের নাম প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerPhoneNo')
                .notEmpty()
                .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerZilla')
                .notEmpty()
                .withMessage('গ্রাহকের জেলা প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের জেলা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerUpazilla')
                .notEmpty()
                .withMessage('গ্রাহকের উপজেলা প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের উপজেলা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('deliveryAddress')
                .notEmpty()
                .withMessage('ডেলিভারি ঠিকানা প্রয়োজন')
                .isString()
                .withMessage('ডেলিভারি ঠিকানা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('comments')
                .optional()
                .isString()
                .withMessage('মন্তব্য অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('products')
                .isArray({ min: 1 })
                .withMessage('অন্তত একটি পণ্য প্রয়োজন')
                .custom(products => {
                if (!products.every((p) => p.id && p.quantity)) {
                    throw new Error('প্রতিটি পণ্যে আইডি এবং পরিমাণ থাকতে হবে');
                }
                return true;
            }),
        ];
    }
    static createCustomerOrder() {
        return [
            (0, express_validator_1.body)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('customerName')
                .notEmpty()
                .withMessage('গ্রাহকের নাম প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerPhoneNo')
                .notEmpty()
                .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerZilla')
                .notEmpty()
                .withMessage('গ্রাহকের জেলা প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের জেলা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerUpazilla')
                .notEmpty()
                .withMessage('গ্রাহকের উপজেলা প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের উপজেলা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('deliveryAddress')
                .notEmpty()
                .withMessage('ডেলিভারি ঠিকানা প্রয়োজন')
                .isString()
                .withMessage('ডেলিভারি ঠিকানা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('comments')
                .optional()
                .isString()
                .withMessage('মন্তব্য অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('products')
                .isArray({ min: 1 })
                .withMessage('অন্তত একটি পণ্য প্রয়োজন')
                .custom(products => {
                if (!products.every((p) => p.id && p.quantity)) {
                    throw new Error('প্রতিটি পণ্যে আইডি এবং পরিমাণ থাকতে হবে');
                }
                return true;
            }),
        ];
    }
    static getSellerOrders() {
        return [
            (0, express_validator_1.query)('orderStatus').optional(),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা নম্বর অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1 })
                .withMessage('সীমা অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    static getCustomerOrders() {
        return [
            // must be eleven digit bangladeshi phone number
            (0, express_validator_1.query)('phoneNo')
                .notEmpty()
                .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 11, max: 11 })
                .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে'),
            (0, express_validator_1.query)('orderStatus').optional(),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা নম্বর অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1 })
                .withMessage('সীমা অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    static orderPaymentBySeller() {
        return [
            (0, express_validator_1.body)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('paymentMethod')
                .notEmpty()
                .withMessage('পেমেন্ট মেথড প্রয়োজন')
                .isIn(['BALANCE', 'WALLET'])
                .withMessage('অবৈধ পেমেন্ট মেথড'),
            (0, express_validator_1.body)('sellerWalletName')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('সেলার ওয়ালেট নাম প্রয়োজন')
                .isString()
                .withMessage('সেলার ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('sellerWalletPhoneNo')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('সেলার ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('সেলার ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('systemWalletPhoneNo')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('amount')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('পরিমাণ প্রয়োজন')
                .isFloat({ min: 0 })
                .withMessage('পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('ট্রানজেকশন আইডি প্রয়োজন')
                .isString()
                .withMessage('ট্রানজেকশন আইডি অবশ্যই স্ট্রিং হতে হবে')
                .trim(),
        ];
    }
    static orderPaymentByCustomer() {
        return [
            (0, express_validator_1.body)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('customerWalletName')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('সেলার ওয়ালেট নাম প্রয়োজন')
                .isString()
                .withMessage('সেলার ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('customerWalletPhoneNo')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('গ্রাহক ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('গ্রাহক ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('systemWalletPhoneNo')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('amount')
                .if((0, express_validator_1.body)('paymentMethod').not().equals('BALANCE'))
                .notEmpty()
                .withMessage('পরিমাণ প্রয়োজন')
                .isFloat({ min: 0 })
                .withMessage('পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .notEmpty()
                .withMessage('ট্রানজেকশন আইডি প্রয়োজন')
                .isString()
                .withMessage('ট্রানজেকশন আইডি অবশ্যই স্ট্রিং হতে হবে')
                .trim(),
        ];
    }
    static cancelOrderBySeller() {
        return [
            (0, express_validator_1.body)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('reason')
                .notEmpty()
                .withMessage('বাতিলের কারণ প্রয়োজন')
                .isString()
                .withMessage('বাতিলের কারণ অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    static cancelOrderByCustomer() {
        return [
            // must be eleven digit bangladeshi phone number
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isString()
                .withMessage('ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে'),
            (0, express_validator_1.body)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('reason')
                .notEmpty()
                .withMessage('বাতিলের কারণ প্রয়োজন')
                .isString()
                .withMessage('বাতিলের কারণ অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    static cancelOrderByAdmin() {
        return [
            (0, express_validator_1.param)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('reason')
                .optional()
                .isString()
                .withMessage('বাতিলের কারণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('transactionId')
                .optional()
                .isString()
                .withMessage('ট্রানজেকশন আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('systemWalletPhoneNo').optional(),
        ];
    }
    static confirmOrderBySeller() {
        return [
            (0, express_validator_1.param)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static deliverOrderByAdmin() {
        return [
            (0, express_validator_1.param)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('trackingUrl')
                .isString()
                .withMessage('ট্র্যাকিং URL অবশ্যই স্ট্রিং হতে হবে')
                .isURL()
                .withMessage('ট্র্যাকিং URL সঠিক নয়'),
        ];
    }
    static confirmOrderByAdmin() {
        return [
            (0, express_validator_1.param)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static rejectOrderByAdmin() {
        return [
            (0, express_validator_1.param)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static completeOrderByAdmin() {
        return [
            (0, express_validator_1.param)('orderId')
                .notEmpty()
                .withMessage('অর্ডার আইডি প্রয়োজন')
                .isInt()
                .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('amountPaidByCustomer')
                .notEmpty()
                .withMessage('গ্রাহক কর্তৃক পরিশোধিত পরিমাণ প্রয়োজন')
                .isFloat({ min: 0 })
                .withMessage('পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
        ];
    }
}
exports.default = OrderValidator;
