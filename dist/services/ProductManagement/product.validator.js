"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
class ProductValidator {
    // ==========================================
    // PRODUCT CRUD VALIDATORS
    // ==========================================
    static createProduct() {
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
            (0, express_validator_1.body)('name')
                .notEmpty()
                .withMessage('পণ্যের নাম প্রয়োজন')
                .isString()
                .withMessage('পণ্যের নাম অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 3 })
                .withMessage('পণ্যের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('description')
                .notEmpty()
                .withMessage('পণ্যের বিবরণ প্রয়োজন')
                .isString()
                .withMessage('পণ্যের বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('basePrice')
                .notEmpty()
                .withMessage('মূল্য প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক মূল্য প্রদান করুন');
                }
            }),
            (0, express_validator_1.body)('suggestedMaxPrice')
                .notEmpty()
                .withMessage('সুপারিশকৃত সর্বোচ্চ মূল্য প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক সুপারিশকৃত সর্বোচ্চ মূল্য প্রদান করুন');
                }
            })
                .custom((value, { req }) => {
                const basePrice = new client_1.Prisma.Decimal(req.body.basePrice);
                const suggestedMaxPrice = new client_1.Prisma.Decimal(value);
                if (suggestedMaxPrice.lessThan(basePrice)) {
                    throw new Error('সুপারিশকৃত সর্বোচ্চ মূল্য বেস মূল্যের চেয়ে বেশি হতে হবে');
                }
                return true;
            }),
        ];
    }
    static getProductDetailForAdmin() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static updateProduct() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
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
            (0, express_validator_1.body)('name')
                .notEmpty()
                .withMessage('পণ্যের নাম প্রয়োজন')
                .isString()
                .withMessage('পণ্যের নাম অবশ্যই স্ট্রিং হতে হবে')
                .isLength({ min: 3 })
                .withMessage('পণ্যের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('description')
                .notEmpty()
                .withMessage('পণ্যের বিবরণ প্রয়োজন')
                .isString()
                .withMessage('পণ্যের বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('basePrice')
                .notEmpty()
                .withMessage('মূল্য প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক মূল্য প্রদান করুন');
                }
            }),
            (0, express_validator_1.body)('suggestedMaxPrice')
                .notEmpty()
                .withMessage('সুপারিশকৃত সর্বোচ্চ মূল্য প্রয়োজন')
                .custom(value => {
                try {
                    new client_1.Prisma.Decimal(value);
                    return true;
                }
                catch (_a) {
                    throw new Error('সঠিক সুপারিশকৃত সর্বোচ্চ মূল্য প্রদান করুন');
                }
            })
                .custom((value, { req }) => {
                const basePrice = new client_1.Prisma.Decimal(req.body.basePrice);
                const suggestedMaxPrice = new client_1.Prisma.Decimal(value);
                if (suggestedMaxPrice.lessThan(basePrice)) {
                    throw new Error('সুপারিশকৃত সর্বোচ্চ মূল্য বেস মূল্যের চেয়ে বেশি হতে হবে');
                }
                return true;
            }),
            (0, express_validator_1.body)('published')
                .optional()
                .isBoolean()
                .withMessage('প্রকাশিত স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে'),
        ];
    }
    static togglePublishStatus() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('publish')
                .notEmpty()
                .withMessage('প্রকাশনার অবস্থা প্রয়োজন')
                .isBoolean()
                .withMessage('প্রকাশনার অবস্থা অবশ্যই বুলিয়ান হতে হবে'),
        ];
    }
    // ==========================================
    // VARIANT MANAGEMENT VALIDATORS
    // ==========================================
    static getProductVariants() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static replaceVariants() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('variants')
                .isArray()
                .withMessage('ভ্যারিয়েন্ট অবশ্যই অ্যারে হতে হবে')
                .custom(variants => {
                if (!variants.every((v) => v.name && v.value)) {
                    throw new Error('প্রতিটি ভ্যারিয়েন্টে নাম এবং মান থাকতে হবে');
                }
                return true;
            }),
        ];
    }
    // ==========================================
    // IMAGE MANAGEMENT VALIDATORS
    // ==========================================
    static addImages() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('images')
                .isArray({ min: 1 })
                .withMessage('অন্তত একটি ইমেজ প্রয়োজন')
                .custom(images => {
                const primaryCount = images.filter((img) => img.isPrimary).length;
                if (primaryCount !== 1) {
                    throw new Error('ঠিক একটি ইমেজ প্রাইমারি হিসেবে চিহ্নিত হতে হবে');
                }
                return true;
            })
                .custom(images => {
                if (!images.every((img) => img.url)) {
                    throw new Error('প্রতিটি ইমেজে URL থাকতে হবে');
                }
                return true;
            }),
        ];
    }
    static getImages() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static updateImage() {
        return [
            (0, express_validator_1.param)('imageId')
                .notEmpty()
                .withMessage('ইমেজ আইডি প্রয়োজন')
                .isInt()
                .withMessage('ইমেজ আইডি অবশ্যই সংখ্যা হতে হবে'),
            (0, express_validator_1.body)('isPrimary')
                .optional()
                .isBoolean()
                .withMessage('প্রাইমারি স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে'),
            (0, express_validator_1.body)('hidden')
                .optional()
                .isBoolean()
                .withMessage('লুকানো স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে'),
        ];
    }
    static deleteImage() {
        return [
            (0, express_validator_1.param)('imageId')
                .notEmpty()
                .withMessage('ইমেজ আইডি প্রয়োজন')
                .isInt()
                .withMessage('ইমেজ আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static deleteAllImages() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    // ==========================================
    // PRODUCT VIEW VALIDATORS
    // ==========================================
    static getProductDetailForCustomer() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    static getProductDetailForSeller() {
        return [
            (0, express_validator_1.param)('productId')
                .notEmpty()
                .withMessage('পণ্য আইডি প্রয়োজন')
                .isInt()
                .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
        ];
    }
    // ==========================================
    // PRODUCT LISTING VALIDATORS
    // ==========================================
    // ==========================================
    // PRODUCT LISTING VALIDATORS
    // ==========================================
    static getAllProductsForAdmin() {
        return [
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
            // query('minPrice')
            //   .optional()
            //   .isFloat({ min: 0 })
            //   .withMessage('ন্যূনতম মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
            //   .toFloat(),
            // query('maxPrice')
            //   .optional()
            //   .isFloat({ min: 0 })
            //   .withMessage('সর্বোচ্চ মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
            //   .toFloat()
            //   .custom((value, { req }) => {
            //     const minPrice = req.query?.minPrice
            //     if (minPrice && value < Number(minPrice)) {
            //       throw new Error('সর্বোচ্চ মূল্য ন্যূনতম মূল্যের চেয়ে বেশি হতে হবে')
            //     }
            //     return true
            //   }),
            (0, express_validator_1.query)('shopId')
                .optional()
                .isInt({ min: 1 })
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে')
                .toInt(),
            // query('categoryId')
            //   .optional()
            //   .isInt({ min: 1 })
            //   .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে')
            //   .toInt(),
            (0, express_validator_1.query)('published')
                .optional()
                .isBoolean()
                .withMessage('প্রকাশিত স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে')
                .toBoolean(),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ এর বেশি হতে হবে')
                .default(1)
                .toInt(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 1000 })
                .withMessage('সীমা অবশ্যই ১ থেকে ১০০০ এর মধ্যে হতে হবে')
                .default(10)
                .toInt(),
        ];
    }
    static getAllProductsForCustomer() {
        return [
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.query)('minPrice')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('ন্যূনতম মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
                .toFloat(),
            (0, express_validator_1.query)('maxPrice')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('সর্বোচ্চ মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
                .toFloat()
                .custom((value, { req }) => {
                var _a;
                if (((_a = req.query) === null || _a === void 0 ? void 0 : _a.minPrice) && value < Number(req.query.minPrice)) {
                    throw new Error('সর্বোচ্চ মূল্য ন্যূনতম মূল্যের চেয়ে বেশি হতে হবে');
                }
                return true;
            }),
            (0, express_validator_1.query)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt({ min: 1 })
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে')
                .toInt(),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ এর বেশি হতে হবে')
                .default(1)
                .toInt(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে')
                .default(10)
                .toInt(),
        ];
    }
    static getAllProductsForSeller() {
        return [
            (0, express_validator_1.query)('search')
                .optional()
                .isString()
                .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.query)('minPrice')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('ন্যূনতম মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
                .toFloat(),
            (0, express_validator_1.query)('maxPrice')
                .optional()
                .isFloat({ min: 0 })
                .withMessage('সর্বোচ্চ মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
                .toFloat()
                .custom((value, { req }) => {
                var _a;
                if (((_a = req.query) === null || _a === void 0 ? void 0 : _a.minPrice) && value < Number(req.query.minPrice)) {
                    throw new Error('সর্বোচ্চ মূল্য ন্যূনতম মূল্যের চেয়ে বেশি হতে হবে');
                }
                return true;
            }),
            (0, express_validator_1.query)('categoryId')
                .notEmpty()
                .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
                .isInt({ min: 1 })
                .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে')
                .toInt(),
            (0, express_validator_1.query)('shopId')
                .notEmpty()
                .withMessage('দোকান আইডি প্রয়োজন')
                .isInt({ min: 1 })
                .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে')
                .toInt(),
            (0, express_validator_1.query)('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ এর বেশি হতে হবে')
                .default(1)
                .toInt(),
            (0, express_validator_1.query)('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে')
                .default(10)
                .toInt(),
        ];
    }
}
exports.default = ProductValidator;
