"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
class UserManagementValidator {
    /**
     * Validation rules for creating first super admin
     */
    static createFirstSuperAdmin() {
        return [
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('name')
                .notEmpty()
                .withMessage('নাম প্রয়োজন')
                .isLength({ min: 3 })
                .withMessage('নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .withMessage('পাসওয়ার্ড প্রয়োজন')
                .isLength({ min: 6 })
                .withMessage('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('email').optional().isEmail().withMessage('সঠিক ইমেইল প্রদান করুন'),
        ];
    }
    /**
     * Validation rules for creating super admin
     */
    static createSuperAdmin() {
        return this.createFirstSuperAdmin(); // Same validation as first super admin
    }
    /**
     * Validation rules for creating admin
     */
    static createAdmin() {
        return [
            ...this.createSuperAdmin(), // Inherit from super admin
            // Add any additional admin-specific validations if needed
        ];
    }
    /**
     * Validation rules for creating seller
     */
    static createSeller() {
        return [
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('name')
                .notEmpty()
                .withMessage('নাম প্রয়োজন')
                .isLength({ min: 3 })
                .withMessage('নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('password')
                .notEmpty()
                .withMessage('পাসওয়ার্ড প্রয়োজন')
                .isLength({ min: 6 })
                .withMessage('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('zilla').notEmpty().withMessage('জেলা প্রয়োজন'),
            (0, express_validator_1.body)('upazilla').notEmpty().withMessage('উপজেলা প্রয়োজন'),
            (0, express_validator_1.body)('address').notEmpty().withMessage('ঠিকানা প্রয়োজন'),
            (0, express_validator_1.body)('shopName').notEmpty().withMessage('দোকানের নাম প্রয়োজন'),
            (0, express_validator_1.body)('email').optional().isEmail().withMessage('সঠিক ইমেইল প্রদান করুন'),
            (0, express_validator_1.body)('nomineePhone')
                .optional()
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('facebookProfileLink')
                .optional()
                .isURL()
                .withMessage('সঠিক ফেসবুক প্রোফাইল লিংক প্রদান করুন'),
            (0, express_validator_1.body)('referralCode')
                .optional()
                .trim()
                .matches(/^[a-zA-Z0-9-_]+$/)
                .withMessage('রেফারাল কোডটি শুধুমাত্র অক্ষর, সংখ্যা, (-) এবং (_) থাকতে পারে।')
                .isLength({ max: 16, min: 3 })
                .withMessage('রেফারাল কোডটি ৩ থেকে ১৬ অক্ষরের মধ্যে হতে হবে।'),
        ];
    }
    /**
     * Validation rules for creating customer
     */
    static createCustomer() {
        return [
            (0, express_validator_1.body)('customerPhoneNo')
                .notEmpty()
                .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('customerName')
                .notEmpty()
                .withMessage('গ্রাহকের নাম প্রয়োজন')
                .isLength({ min: 3 })
                .withMessage('গ্রাহকের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('sellerCode')
                .notEmpty()
                .withMessage('বিক্রেতা কোড প্রয়োজন')
                .isString()
                .withMessage('বিক্রেতা কোড অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    /**
     * Validation rules for user login
     */
    static login() {
        return [
            (0, express_validator_1.body)('phoneNo')
                .notEmpty()
                .withMessage('ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('password').notEmpty().withMessage('পাসওয়ার্ড প্রয়োজন'),
        ];
    }
    /**
     * Validation rules for resetting password
     */
    static resetPassword() {
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
     * Validation rules for getting user profile
     */
    static getProfile() {
        return [
        // Typically authenticated route, might not need body validation
        // Add any necessary validation here
        ];
    }
    /**
     * Validation rules for updating profile
     */
    static updateProfile() {
        return [
            (0, express_validator_1.body)('name')
                .optional()
                .isLength({ min: 3 })
                .withMessage('নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
            (0, express_validator_1.body)('email').optional().isEmail().withMessage('সঠিক ইমেইল প্রদান করুন'),
            (0, express_validator_1.body)('zilla')
                .optional()
                .isString()
                .withMessage('জেলা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('upazilla')
                .optional()
                .isString()
                .withMessage('উপজেলা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('address')
                .optional()
                .isString()
                .withMessage('ঠিকানা অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('shopName')
                .optional()
                .isString()
                .withMessage('দোকানের নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('nomineePhone')
                .optional()
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('facebookProfileLink')
                .optional()
                .isURL()
                .withMessage('সঠিক ফেসবুক প্রোফাইল লিংক প্রদান করুন'),
        ];
    }
    /**
     * Validation rules for changing password
     */
    static changePassword() {
        return [
            (0, express_validator_1.body)('currentPassword')
                .notEmpty()
                .withMessage('বর্তমান পাসওয়ার্ড প্রয়োজন'),
            (0, express_validator_1.body)('newPassword')
                .notEmpty()
                .withMessage('নতুন পাসওয়ার্ড প্রয়োজন')
                .isLength({ min: 6 })
                .withMessage('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে')
                .custom((value, { req }) => value !== req.body.currentPassword)
                .withMessage('নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের মতো হতে পারবে না'),
        ];
    }
    /**
     * Validation rules for creating role
     */
    static createRole() {
        return [
            (0, express_validator_1.body)('roleName')
                .notEmpty()
                .withMessage('রোলের নাম প্রয়োজন')
                .isString()
                .withMessage('রোলের নাম অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('description')
                .optional()
                .isString()
                .withMessage('বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('isDefault')
                .optional()
                .isBoolean()
                .withMessage('ডিফল্ট মান অবশ্যই বুলিয়ান হতে হবে'),
        ];
    }
    /**
     * Validation rules for assigning permission to role
     */
    static assignPermissionToRole() {
        return [
            (0, express_validator_1.body)('roleId')
                .notEmpty()
                .withMessage('রোল আইডি প্রয়োজন')
                .isString()
                .withMessage('রোল আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('permission')
                .notEmpty()
                .withMessage('অনুমতি প্রয়োজন')
                .isIn(Object.values(client_1.PermissionType))
                .withMessage('অবৈধ অনুমতি প্রকার'),
            (0, express_validator_1.body)('actions')
                .notEmpty()
                .withMessage('ক্রিয়া প্রয়োজন')
                .isArray()
                .withMessage('ক্রিয়াগুলি অবশ্যই অ্যারে হতে হবে')
                .custom((actions) => actions.every((action) => Object.values(client_1.ActionType).includes(action)))
                .withMessage('অবৈধ ক্রিয়া প্রকার'),
        ];
    }
    /**
     * Validation rules for assigning role to user
     */
    static assignRoleToUser() {
        return [
            (0, express_validator_1.body)('userId')
                .notEmpty()
                .withMessage('ব্যবহারকারী আইডি প্রয়োজন')
                .isString()
                .withMessage('ব্যবহারকারী আইডি অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('roleId')
                .notEmpty()
                .withMessage('রোল আইডি প্রয়োজন')
                .isString()
                .withMessage('রোল আইডি অবশ্যই স্ট্রিং হতে হবে'),
        ];
    }
    /**
     * Validation rules for blocking user
     */
    static blockUser() {
        return [
            (0, express_validator_1.body)('userPhoneNo')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('reason')
                .optional()
                .isString()
                .withMessage('কারণ অবশ্যই স্ট্রিং হতে হবে'),
            (0, express_validator_1.body)('actionTypes')
                .notEmpty()
                .withMessage('ক্রিয়ার প্রকার প্রয়োজন')
                .isArray()
                .withMessage('ক্রিয়ার প্রকারগুলি অবশ্যই অ্যারে হতে হবে')
                .custom((actions) => actions.every((action) => Object.values(client_1.BlockActionType).includes(action)))
                .withMessage('অবৈধ ক্রিয়া প্রকার'),
            (0, express_validator_1.body)('expiresAt')
                .optional()
                .isISO8601()
                .withMessage('সঠিক তারিখ ফরম্যাট প্রদান করুন (ISO8601)'),
        ];
    }
    /**
     * Validation rules for checking if user is blocked
     */
    static isUserBlocked() {
        return [
            (0, express_validator_1.body)('userPhoneNo')
                .notEmpty()
                .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
                .isMobilePhone('bn-BD')
                .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
                .isLength({ min: 11, max: 11 })
                .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
            (0, express_validator_1.body)('actionType')
                .notEmpty()
                .withMessage('ক্রিয়ার প্রকার প্রয়োজন')
                .isIn(Object.values(client_1.BlockActionType))
                .withMessage('অবৈধ ক্রিয়া প্রকার'),
        ];
    }
}
exports.default = UserManagementValidator;
