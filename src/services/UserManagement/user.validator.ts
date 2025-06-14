import { ActionType, BlockActionType, PermissionType } from '@prisma/client'
import { RequestHandler } from 'express'
import { body } from 'express-validator'

class UserManagementValidator {
  /**
   * Validation rules for creating first super admin
   */
  static createFirstSuperAdmin(): RequestHandler[] {
    return [
      body('phoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('name')
        .notEmpty()
        .withMessage('নাম প্রয়োজন')
        .isLength({ min: 3 })
        .withMessage('নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('password')
        .notEmpty()
        .withMessage('পাসওয়ার্ড প্রয়োজন')
        .isLength({ min: 6 })
        .withMessage('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে'),
      body('email').optional().isEmail().withMessage('সঠিক ইমেইল প্রদান করুন'),
    ]
  }

  /**
   * Validation rules for creating super admin
   */
  static createSuperAdmin(): RequestHandler[] {
    return this.createFirstSuperAdmin() // Same validation as first super admin
  }

  /**
   * Validation rules for creating admin
   */
  static createAdmin(): RequestHandler[] {
    return [
      ...this.createSuperAdmin(), // Inherit from super admin
      // Add any additional admin-specific validations if needed
    ]
  }

  /**
   * Validation rules for creating seller
   */
  static createSeller(): RequestHandler[] {
    return [
      body('phoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('name')
        .notEmpty()
        .withMessage('নাম প্রয়োজন')
        .isLength({ min: 3 })
        .withMessage('নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('password')
        .notEmpty()
        .withMessage('পাসওয়ার্ড প্রয়োজন')
        .isLength({ min: 6 })
        .withMessage('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে'),
      body('zilla').notEmpty().withMessage('জেলা প্রয়োজন'),
      body('upazilla').notEmpty().withMessage('উপজেলা প্রয়োজন'),
      body('address').notEmpty().withMessage('ঠিকানা প্রয়োজন'),
      body('shopName').notEmpty().withMessage('দোকানের নাম প্রয়োজন'),
      body('email').optional().isEmail().withMessage('সঠিক ইমেইল প্রদান করুন'),
      body('nomineePhone')
        .optional()
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('facebookProfileLink')
        .optional()
        .isURL()
        .withMessage('সঠিক ফেসবুক প্রোফাইল লিংক প্রদান করুন'),
      body('referralCode')
        .optional()
        .isString()
        .withMessage('রেফারেল কোড অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 6, max: 12 })
        .withMessage('রেফারেল কোড অবশ্যই ৬ থেকে ১২ অক্ষরের মধ্যে হতে হবে'),
    ]
  }

  /**
   * Validation rules for creating customer
   */
  static createCustomer(): RequestHandler[] {
    return [
      body('customerPhoneNo')
        .notEmpty()
        .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('customerName')
        .notEmpty()
        .withMessage('গ্রাহকের নাম প্রয়োজন')
        .isLength({ min: 3 })
        .withMessage('গ্রাহকের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('sellerCode')
        .notEmpty()
        .withMessage('বিক্রেতা কোড প্রয়োজন')
        .isString()
        .withMessage('বিক্রেতা কোড অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  /**
   * Validation rules for user login
   */
  static login(): RequestHandler[] {
    return [
      body('phoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('password').notEmpty().withMessage('পাসওয়ার্ড প্রয়োজন'),
    ]
  }

  /**
   * Validation rules for resetting password
   */
  static resetPassword(): RequestHandler[] {
    return [
      body('phoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
    ]
  }

  /**
   * Validation rules for getting user profile
   */
  static getProfile(): RequestHandler[] {
    return [
      // Typically authenticated route, might not need body validation
      // Add any necessary validation here
    ]
  }

  /**
   * Validation rules for updating profile
   */
  static updateProfile(): RequestHandler[] {
    return [
      body('name')
        .optional()
        .isLength({ min: 3 })
        .withMessage('নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('email').optional().isEmail().withMessage('সঠিক ইমেইল প্রদান করুন'),
      body('zilla')
        .optional()
        .isString()
        .withMessage('জেলা অবশ্যই স্ট্রিং হতে হবে'),
      body('upazilla')
        .optional()
        .isString()
        .withMessage('উপজেলা অবশ্যই স্ট্রিং হতে হবে'),
      body('address')
        .optional()
        .isString()
        .withMessage('ঠিকানা অবশ্যই স্ট্রিং হতে হবে'),
      body('shopName')
        .optional()
        .isString()
        .withMessage('দোকানের নাম অবশ্যই স্ট্রিং হতে হবে'),
      body('nomineePhone')
        .optional()
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('facebookProfileLink')
        .optional()
        .isURL()
        .withMessage('সঠিক ফেসবুক প্রোফাইল লিংক প্রদান করুন'),
    ]
  }

  /**
   * Validation rules for changing password
   */
  static changePassword(): RequestHandler[] {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('বর্তমান পাসওয়ার্ড প্রয়োজন'),
      body('newPassword')
        .notEmpty()
        .withMessage('নতুন পাসওয়ার্ড প্রয়োজন')
        .isLength({ min: 6 })
        .withMessage('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে')
        .custom((value, { req }) => value !== req.body.currentPassword)
        .withMessage('নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের মতো হতে পারবে না'),
    ]
  }

  /**
   * Validation rules for creating role
   */
  static createRole(): RequestHandler[] {
    return [
      body('roleName')
        .notEmpty()
        .withMessage('রোলের নাম প্রয়োজন')
        .isString()
        .withMessage('রোলের নাম অবশ্যই স্ট্রিং হতে হবে'),
      body('description')
        .optional()
        .isString()
        .withMessage('বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
      body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('ডিফল্ট মান অবশ্যই বুলিয়ান হতে হবে'),
    ]
  }

  /**
   * Validation rules for assigning permission to role
   */
  static assignPermissionToRole(): RequestHandler[] {
    return [
      body('roleId')
        .notEmpty()
        .withMessage('রোল আইডি প্রয়োজন')
        .isString()
        .withMessage('রোল আইডি অবশ্যই স্ট্রিং হতে হবে'),
      body('permission')
        .notEmpty()
        .withMessage('অনুমতি প্রয়োজন')
        .isIn(Object.values(PermissionType))
        .withMessage('অবৈধ অনুমতি প্রকার'),
      body('actions')
        .notEmpty()
        .withMessage('ক্রিয়া প্রয়োজন')
        .isArray()
        .withMessage('ক্রিয়াগুলি অবশ্যই অ্যারে হতে হবে')
        .custom((actions: ActionType[]) =>
          actions.every((action: ActionType) =>
            Object.values(ActionType).includes(action)
          )
        )
        .withMessage('অবৈধ ক্রিয়া প্রকার'),
    ]
  }

  /**
   * Validation rules for assigning role to user
   */
  static assignRoleToUser(): RequestHandler[] {
    return [
      body('userId')
        .notEmpty()
        .withMessage('ব্যবহারকারী আইডি প্রয়োজন')
        .isString()
        .withMessage('ব্যবহারকারী আইডি অবশ্যই স্ট্রিং হতে হবে'),
      body('roleId')
        .notEmpty()
        .withMessage('রোল আইডি প্রয়োজন')
        .isString()
        .withMessage('রোল আইডি অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  /**
   * Validation rules for blocking user
   */
  static blockUser(): RequestHandler[] {
    return [
      body('userPhoneNo')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('reason')
        .optional()
        .isString()
        .withMessage('কারণ অবশ্যই স্ট্রিং হতে হবে'),
      body('actionTypes')
        .notEmpty()
        .withMessage('ক্রিয়ার প্রকার প্রয়োজন')
        .isArray()
        .withMessage('ক্রিয়ার প্রকারগুলি অবশ্যই অ্যারে হতে হবে')
        .custom((actions: BlockActionType[]) =>
          actions.every((action: BlockActionType) =>
            Object.values(BlockActionType).includes(action)
          )
        )
        .withMessage('অবৈধ ক্রিয়া প্রকার'),
      body('expiresAt')
        .optional()
        .isISO8601()
        .withMessage('সঠিক তারিখ ফরম্যাট প্রদান করুন (ISO8601)'),
    ]
  }

  /**
   * Validation rules for checking if user is blocked
   */
  static isUserBlocked(): RequestHandler[] {
    return [
      body('userPhoneNo')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
      body('actionType')
        .notEmpty()
        .withMessage('ক্রিয়ার প্রকার প্রয়োজন')
        .isIn(Object.values(BlockActionType))
        .withMessage('অবৈধ ক্রিয়া প্রকার'),
    ]
  }
}

export default UserManagementValidator
