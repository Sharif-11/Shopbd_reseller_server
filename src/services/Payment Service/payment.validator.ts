import { PaymentStatus, PaymentType, SenderType } from '@prisma/client'
import { body, param, query } from 'express-validator'

class PaymentValidator {
  /**
   * Validation rules for creating a payment
   */
  static createPayment() {
    return [
      body('paymentType')
        .notEmpty()
        .withMessage('পেমেন্টের ধরন প্রয়োজন')
        .isIn(Object.values(PaymentType))
        .withMessage('পেমেন্টের ধরন সঠিক নয়'),

      body('sender')
        .notEmpty()
        .withMessage('প্রেরকের ধরন প্রয়োজন')
        .isIn(Object.values(SenderType))
        .withMessage('প্রেরকের ধরন সঠিক নয়'),

      body('userWalletName')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ওয়ালেট নাম প্রয়োজন')
        .isString()
        .withMessage('ব্যবহারকারীর ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),

      body('userWalletPhoneNo')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),

      body('systemWalletPhoneNo')
        .notEmpty()
        .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),

      body('amount')
        .notEmpty()
        .withMessage('পরিমাণ প্রয়োজন')
        .isNumeric()
        .withMessage('পরিমাণ অবশ্যই সংখ্যা হতে হবে')
        .isFloat({ gt: 0 })
        .withMessage('পরিমাণ অবশ্যই ০ এর চেয়ে বড় হতে হবে'),

      body('transactionId')
        .notEmpty()
        .withMessage('লেনদেন আইডি প্রয়োজন')
        .isString()
        .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  /**
   * Validation rules for creating a withdrawal payment
   */
  static createWithdrawPayment() {
    return [
      body('amount')
        .notEmpty()
        .withMessage('পরিমাণ প্রয়োজন')
        .isNumeric()
        .withMessage('পরিমাণ অবশ্যই সংখ্যা হতে হবে')
        .isFloat({ gt: 0 })
        .withMessage('পরিমাণ অবশ্যই ০ এর চেয়ে বড় হতে হবে'),

      body('transactionFee')
        .notEmpty()
        .withMessage('লেনদেন ফি প্রয়োজন')
        .isNumeric()
        .withMessage('লেনদেন ফি অবশ্যই সংখ্যা হতে হবে')
        .isFloat({ min: 0 })
        .withMessage('লেনদেন ফি অবশ্যই ০ বা তার চেয়ে বড় হতে হবে'),

      body('systemWalletPhoneNo')
        .notEmpty()
        .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),

      body('systemWalletName')
        .notEmpty()
        .withMessage('সিস্টেম ওয়ালেট নাম প্রয়োজন')
        .isString()
        .withMessage('সিস্টেম ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),

      body('transactionId')
        .notEmpty()
        .withMessage('লেনদেন আইডি প্রয়োজন')
        .isString()
        .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),

      body('userWalletName')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ওয়ালেট নাম প্রয়োজন')
        .isString()
        .withMessage('ব্যবহারকারীর ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),

      body('userWalletPhoneNo')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),
    ]
  }

  /**
   * Validation rules for verifying a payment by admin
   */
  static verifyPaymentByAdmin() {
    return [
      param('paymentId')
        .notEmpty()
        .withMessage('পেমেন্ট আইডি প্রয়োজন')
        .isString()
        .withMessage('পেমেন্ট আইডি অবশ্যই স্ট্রিং হতে হবে'),

      body('transactionId')
        .notEmpty()
        .withMessage('লেনদেন আইডি প্রয়োজন')
        .isString()
        .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  /**
   * Validation rules for rejecting a payment by admin
   */
  static rejectPaymentByAdmin() {
    return [
      param('paymentId')
        .notEmpty()
        .withMessage('পেমেন্ট আইডি প্রয়োজন')
        .isString()
        .withMessage('পেমেন্ট আইডি অবশ্যই স্ট্রিং হতে হবে'),

      body('remarks')
        .notEmpty()
        .withMessage('মন্তব্য প্রয়োজন')
        .isString()
        .withMessage('মন্তব্য অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 5 })
        .withMessage('মন্তব্য অবশ্যই ৫ অক্ষরের বেশি হতে হবে'),
    ]
  }

  /**
   * Validation rules for getting all payments of a user
   */
  static getAllPaymentsOfAUser() {
    return [
      param('userPhoneNo')
        .notEmpty()
        .withMessage('ব্যবহারকারীর ফোন নম্বর প্রয়োজন')
        .isMobilePhone('bn-BD')
        .withMessage('সঠিক বাংলাদেশী ফোন নম্বর প্রদান করুন'),

      query('paymentStatus')
        .optional()
        .isIn(Object.values(PaymentStatus))
        .withMessage('পেমেন্ট অবস্থা সঠিক নয়'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ বা তার বেশি হতে হবে'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে'),

      query('search')
        .optional()
        .isString()
        .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  /**
   * Validation rules for getting all payments for admin
   */
  static getAllPaymentsForAdmin() {
    return [
      query('paymentStatus')
        .optional()
        .isIn(Object.values(PaymentStatus))
        .withMessage('পেমেন্ট অবস্থা সঠিক নয়'),

      query('transactionId')
        .optional()
        .isString()
        .withMessage('লেনদেন আইডি অবশ্যই স্ট্রিং হতে হবে'),

      query('search')
        .optional()
        .isString()
        .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),

      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ বা তার বেশি হতে হবে'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে'),
    ]
  }
}

export default PaymentValidator
