"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
class ShopCategoryValidator {
    // ==========================================
    // SHOP MANAGEMENT VALIDATORS
    // ==========================================
    static createShop() {
        return [
            (0, express_validator_1.body)('shopName')
                .notEmpty()
                .withMessage('দোকানের নাম প্রয়োজন')
                .isString()
                .withMessage('দোকানের নাম অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 3 })
                .withMessage('দোকানের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('shopLocation')
                .notEmpty()
                .withMessage('দোকানের অবস্থান প্রয়োজন')
                .isString()
                .withMessage('দোকানের অবস্থান অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('deliveryChargeInside')
                .notEmpty()
                .withMessage('ভিতরে ডেলিভারি চার্জ প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন');
                }
            }),
            (0, express_validator_1.body)('deliveryChargeOutside')
                .notEmpty()
                .withMessage('বাইরে ডেলিভারি চার্জ প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন');
                }
            }),
            (0, express_validator_1.body)('shopDescription')
                .optional()
                .isString()
                .withMessage('দোকানের বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('shopIcon')
                .optional()
                .isURL()
                .withMessage('সঠিক আইকন URL প্রদান করুন'),
        ];
    }
    static getShop() {
        return [
            (0, express_validator_1.param)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static updateShop() {
        return [
            (0, express_validator_1.param)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে')
                .toInt(),
            // Required fields
            (0, express_validator_1.body)('shopName')
                .notEmpty()
                .withMessage('দোকানের নাম প্রয়োজন')
                .isString()
                .withMessage('দোকানের নাম অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 3 })
                .withMessage('দোকানের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে')
                .trim(),
            (0, express_validator_1.body)('shopLocation')
                .notEmpty()
                .withMessage('দোকানের অবস্থান প্রয়োজন')
                .isString()
                .withMessage('দোকানের অবস্থান অবশ্যই স্ট্রিং হতে হবে')
                .trim(),
            (0, express_validator_1.body)('deliveryChargeInside')
                .notEmpty()
                .withMessage('ভিতরে ডেলিভারি চার্জ প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন');
                }
            }),
            (0, express_validator_1.body)('deliveryChargeOutside')
                .notEmpty()
                .withMessage('বাইরে ডেলিভারি চার্জ প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন');
                }
            }),
            (0, express_validator_1.body)('shopDescription')
                .notEmpty()
                .withMessage('দোকানের বিবরণ প্রয়োজন')
                .isString()
                .withMessage('দোকানের বিবরণ অবশ্যই স্ট্রিং হতে হবে')
                .trim(),
            // Optional field
            (0, express_validator_1.body)('shopIcon')
                .optional() // Made optional
                .isURL()
                .withMessage('সঠিক আইকন URL প্রদান করুন')
                .trim(),
            (0, express_validator_1.body)('isActive')
                .notEmpty()
                .withMessage('সক্রিয় অবস্থা প্রয়োজন')
                .isBoolean()
                .withMessage('সক্রিয় অবস্থা অবশ্যই বুলিয়ান হতে হবে')
                .toBoolean(),
        ];
    }
    static openOrCloseShop() {
        return [
            (0, express_validator_1.param)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('isActive')
                .notEmpty()
                .withMessage('সক্রিয় অবস্থা প্রয়োজন')
                .isBoolean()
                .withMessage('সক্রিয় অবস্থা অবশ্যই বুলিয়ান হতে হবে')
                .toBoolean(),
        ];
    }
    // ==========================================
    // CATEGORY MANAGEMENT VALIDATORS
    // ==========================================
    static createCategory() {
        return [
            (0, express_validator_1.body)('name')
                .notEmpty()
                .withMessage('ক্যাটাগরির নাম প্রয়োজন')
                .isString()
                .withMessage('ক্যাটাগরির নাম অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 3 })
                .withMessage('ক্যাটাগরির নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('description')
                .optional()
                .isString()
                .withMessage('ক্যাটাগরির বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('categoryIcon')
                .optional()
                .isURL()
                .withMessage('সঠিক ক্যাটাগরি আইকন URL প্রদান করুন'),
            (0, express_validator_1.body)('parentId')
                .optional()
                .isInt()
                .withMessage('প্যারেন্ট ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static getCategory() {
        return [
            (0, express_validator_1.param)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt()
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static updateCategory() {
        return [
            (0, express_validator_1.param)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt()
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('name')
                .optional()
                .isString()
                .withMessage('ক্যাটাগরির নাম অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 3 })
                .withMessage('ক্যাটাগরির নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('description')
                .optional()
                .isString()
                .withMessage('ক্যাটাগরির বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('categoryIcon')
                .optional()
                .isURL()
                .withMessage('সঠিক ক্যাটাগরি আইকন URL প্রদান করুন'),
        ];
    }
    static deleteCategory() {
        return [
            (0, express_validator_1.param)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt()
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    // ==========================================
    // SHOP-CATEGORY ASSIGNMENT VALIDATORS
    // ==========================================
    static assignCategoryToShop() {
        return [
            (0, express_validator_1.body)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt()
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static removeCategoryFromShop() {
        return [
            (0, express_validator_1.param)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.param)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt()
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static getShopCategories() {
        return [
            (0, express_validator_1.param)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt()
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static getShopsByCategory() {
        return [
            (0, express_validator_1.param)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt()
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
}
exports.default = ShopCategoryValidator;
