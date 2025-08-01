"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
class CommissionValidator {
    /**
     * Validation rules for replacing commission table
     */
    static replaceCommissionTable() {
        return [
            (0, express_validator_1.body)('commissions')
                .isArray({ min: 1 })
                .withMessage('অন্তত একটি কমিশন রেঞ্জ প্রয়োজন'),
            (0, express_validator_1.body)('commissions.*.startPrice')
                .isDecimal()
                .withMessage('শুরুর মূল্য অবশ্যই দশমিক সংখ্যা হতে হবে')
                .toFloat(),
            (0, express_validator_1.body)('commissions.*.endPrice')
                .optional({ nullable: true })
                .isDecimal()
                .withMessage('শেষ মূল্য অবশ্যই দশমিক সংখ্যা হতে হবে')
                .toFloat(),
            (0, express_validator_1.body)('commissions.*.commission')
                .isDecimal()
                .withMessage('কমিশন অবশ্যই দশমিক সংখ্যা হতে হবে')
                .toFloat(),
            (0, express_validator_1.body)('commissions.*.level')
                .isInt({ min: 1 })
                .withMessage('লেভেল অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে')
                .toInt(),
        ];
    }
    /**
     * Validation rules for calculating commissions
     */
    static calculateCommissions() {
        return [
            (0, express_validator_1.body)('userPhone')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('price')
                .isDecimal()
                .withMessage('মূল্য অবশ্যই দশমিক সংখ্যা হতে হবে')
                .toFloat(),
        ];
    }
}
exports.default = CommissionValidator;
