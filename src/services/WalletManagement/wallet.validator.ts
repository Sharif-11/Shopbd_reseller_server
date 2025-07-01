import { WalletType } from '@prisma/client'
import { body, param } from 'express-validator'

class WalletValidator {
  /**
   * Validation rules for sending OTP
   */
  static sendOtp() {
    return [
      body('walletPhoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
    ]
  }
  /**
   * Validation rules for verifying OTP
   */
  static verifyOtp() {
    return [
      body('otp')
        .notEmpty()
        .withMessage('OTP প্রয়োজন')
        .isString()
        .withMessage('OTP অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP অবশ্যই ৬ ডিজিটের হতে হবে')
        .isNumeric()
        .withMessage('OTP অবশ্যই সংখ্যা হতে হবে'),
      body('walletPhoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
    ]
  }

  /**
   * Validation rules for creating a wallet
   */
  static createWallet() {
    return [
      body('walletName')
        .notEmpty()
        .withMessage('ওয়ালেটের নাম প্রয়োজন')
        .isString()
        .withMessage('ওয়ালেটের নাম অবশ্যই স্ট্রিং হতে হবে')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('ওয়ালেটের নাম অবশ্যই ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে'),

      body('walletPhoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),

      body('walletType')
        .optional()
        .isIn(Object.values(WalletType))
        .withMessage('ওয়ালেটের ধরন সঠিক নয়'),
    ]
  }

  /**
   * Validation rules for updating a wallet
   */
  static updateWallet() {
    return [
      param('walletId')
        .isInt()
        .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),

      body('walletName')
        .optional()
        .isString()
        .withMessage('ওয়ালেটের নাম অবশ্যই স্ট্রিং হতে হবে')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('ওয়ালেটের নাম অবশ্যই ২ থেকে ৫০ অক্ষরের মধ্যে হতে হবে'),

      body('walletPhoneNo')
        .optional()
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
    ]
  }
  static updateWalletStatus() {
    return [
      param('walletId')
        .isInt()
        .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('isActive')
        .notEmpty()
        .withMessage('ওয়ালেট active অথবা inactive করতে হবে')
        .isBoolean()
        .withMessage('status অবশ্যই বুলিয়ান হতে হবে'),
    ]
  }

  /**
   * Validation rules for wallet ID parameter
   */
  static walletIdParam() {
    return [
      param('walletId')
        .isInt()
        .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  /**
   * Validation rules for seller ID parameter
   */
  static sellerIdParam() {
    return [
      param('sellerId')
        .isString()
        .withMessage('বিক্রেতা আইডি অবশ্যই স্ট্রিং হতে হবে')
        .notEmpty()
        .withMessage('বিক্রেতা আইডি প্রয়োজন'),
    ]
  }
  static phoneNoParam() {
    return [
      param('phoneNo')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে'),
    ]
  }

  /**
   * Validation rules for wallet verification
   */
  static verifyWallet() {
    return [
      param('walletId')
        .isInt()
        .withMessage('ওয়ালেট আইডি অবশ্যই সংখ্যা হতে হবে'),

      body('otp')
        .notEmpty()
        .withMessage('OTP প্রয়োজন')
        .isString()
        .withMessage('OTP অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP অবশ্যই ৬ ডিজিটের হতে হবে')
        .isNumeric()
        .withMessage('OTP অবশ্যই সংখ্যা হতে হবে'),
    ]
  }
}

export default WalletValidator
