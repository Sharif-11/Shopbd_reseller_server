import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'

class OrderValidator {
  static createSellerOrder(): RequestHandler[] {
    return [
      body('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('customerName')
        .notEmpty()
        .withMessage('গ্রাহকের নাম প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের নাম অবশ্যই স্ট্রিং হতে হবে'),
      body('customerPhoneNo')
        .notEmpty()
        .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
      body('customerZilla')
        .notEmpty()
        .withMessage('গ্রাহকের জেলা প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের জেলা অবশ্যই স্ট্রিং হতে হবে'),
      body('customerUpazilla')
        .notEmpty()
        .withMessage('গ্রাহকের উপজেলা প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের উপজেলা অবশ্যই স্ট্রিং হতে হবে'),
      body('deliveryAddress')
        .notEmpty()
        .withMessage('ডেলিভারি ঠিকানা প্রয়োজন')
        .isString()
        .withMessage('ডেলিভারি ঠিকানা অবশ্যই স্ট্রিং হতে হবে'),
      body('comments')
        .optional()
        .isString()
        .withMessage('মন্তব্য অবশ্যই স্ট্রিং হতে হবে'),
      body('products')
        .isArray({ min: 1 })
        .withMessage('অন্তত একটি পণ্য প্রয়োজন')
        .custom(products => {
          if (!products.every((p: any) => p.id && p.quantity)) {
            throw new Error('প্রতিটি পণ্যে আইডি এবং পরিমাণ থাকতে হবে')
          }
          return true
        }),
    ]
  }
  static createCustomerOrder(): RequestHandler[] {
    return [
      body('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('customerName')
        .notEmpty()
        .withMessage('গ্রাহকের নাম প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের নাম অবশ্যই স্ট্রিং হতে হবে'),
      body('customerPhoneNo')
        .notEmpty()
        .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
      body('customerZilla')
        .notEmpty()
        .withMessage('গ্রাহকের জেলা প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের জেলা অবশ্যই স্ট্রিং হতে হবে'),
      body('customerUpazilla')
        .notEmpty()
        .withMessage('গ্রাহকের উপজেলা প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের উপজেলা অবশ্যই স্ট্রিং হতে হবে'),
      body('deliveryAddress')
        .notEmpty()
        .withMessage('ডেলিভারি ঠিকানা প্রয়োজন')
        .isString()
        .withMessage('ডেলিভারি ঠিকানা অবশ্যই স্ট্রিং হতে হবে'),
      body('comments')
        .optional()
        .isString()
        .withMessage('মন্তব্য অবশ্যই স্ট্রিং হতে হবে'),
      body('products')
        .isArray({ min: 1 })
        .withMessage('অন্তত একটি পণ্য প্রয়োজন')
        .custom(products => {
          if (!products.every((p: any) => p.id && p.quantity)) {
            throw new Error('প্রতিটি পণ্যে আইডি এবং পরিমাণ থাকতে হবে')
          }
          return true
        }),
    ]
  }

  static getSellerOrders(): RequestHandler[] {
    return [
      query('orderStatus').optional(),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা নম্বর অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
      query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('সীমা অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
      query('search')
        .optional()
        .isString()
        .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }
  static getCustomerOrders(): RequestHandler[] {
    return [
      // must be eleven digit bangladeshi phone number
      query('phoneNo')
        .notEmpty()
        .withMessage('গ্রাহকের ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 11, max: 11 })
        .withMessage('গ্রাহকের ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে'),
      query('orderStatus').optional(),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা নম্বর অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
      query('limit')
        .optional()
        .isInt({ min: 1 })
        .withMessage('সীমা অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
      query('search')
        .optional()
        .isString()
        .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  static orderPaymentBySeller(): RequestHandler[] {
    return [
      body('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('paymentMethod')
        .notEmpty()
        .withMessage('পেমেন্ট মেথড প্রয়োজন')
        .isIn(['BALANCE', 'WALLET'])
        .withMessage('অবৈধ পেমেন্ট মেথড'),
      body('sellerWalletName')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('সেলার ওয়ালেট নাম প্রয়োজন')
        .isString()
        .withMessage('সেলার ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
      body('sellerWalletPhoneNo')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('সেলার ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('সেলার ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
      body('systemWalletPhoneNo')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
      body('amount')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('পরিমাণ প্রয়োজন')
        .isFloat({ min: 0 })
        .withMessage('পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
      body('transactionId')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('ট্রানজেকশন আইডি প্রয়োজন')
        .isString()
        .withMessage('ট্রানজেকশন আইডি অবশ্যই স্ট্রিং হতে হবে')
        .trim(),
    ]
  }
  static orderPaymentByCustomer(): RequestHandler[] {
    return [
      body('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('customerWalletName')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('সেলার ওয়ালেট নাম প্রয়োজন')
        .isString()
        .withMessage('সেলার ওয়ালেট নাম অবশ্যই স্ট্রিং হতে হবে'),
      body('customerWalletPhoneNo')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('গ্রাহক ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('গ্রাহক ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
      body('systemWalletPhoneNo')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('সিস্টেম ওয়ালেট ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে'),
      body('amount')
        .if(body('paymentMethod').not().equals('BALANCE'))
        .notEmpty()
        .withMessage('পরিমাণ প্রয়োজন')
        .isFloat({ min: 0 })
        .withMessage('পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
      body('transactionId')
        .notEmpty()
        .withMessage('ট্রানজেকশন আইডি প্রয়োজন')
        .isString()
        .withMessage('ট্রানজেকশন আইডি অবশ্যই স্ট্রিং হতে হবে')
        .trim(),
    ]
  }

  static cancelOrderBySeller(): RequestHandler[] {
    return [
      body('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('reason')
        .notEmpty()
        .withMessage('বাতিলের কারণ প্রয়োজন')
        .isString()
        .withMessage('বাতিলের কারণ অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }

  static cancelOrderByCustomer(): RequestHandler[] {
    return [
      // must be eleven digit bangladeshi phone number
      body('phoneNo')
        .notEmpty()
        .withMessage('ফোন নম্বর প্রয়োজন')
        .isString()
        .withMessage('ফোন নম্বর অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 11, max: 11 })
        .withMessage('ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে'),
      body('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('reason')
        .notEmpty()
        .withMessage('বাতিলের কারণ প্রয়োজন')
        .isString()
        .withMessage('বাতিলের কারণ অবশ্যই স্ট্রিং হতে হবে'),
    ]
  }
  static cancelOrderByAdmin(): RequestHandler[] {
    return [
      param('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('reason')
        .optional()
        .isString()
        .withMessage('বাতিলের কারণ অবশ্যই স্ট্রিং হতে হবে'),
      body('transactionId')
        .optional()
        .isString()
        .withMessage('ট্রানজেকশন আইডি অবশ্যই স্ট্রিং হতে হবে'),
      body('systemWalletPhoneNo').optional(),
    ]
  }

  static confirmOrderBySeller(): RequestHandler[] {
    return [
      param('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static deliverOrderByAdmin(): RequestHandler[] {
    return [
      param('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('trackingUrl')
        .isString()
        .withMessage('ট্র্যাকিং URL অবশ্যই স্ট্রিং হতে হবে')
        .isURL()
        .withMessage('ট্র্যাকিং URL সঠিক নয়'),
    ]
  }

  static confirmOrderByAdmin(): RequestHandler[] {
    return [
      param('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static rejectOrderByAdmin(): RequestHandler[] {
    return [
      param('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }
  static completeOrderByAdmin(): RequestHandler[] {
    return [
      param('orderId')
        .notEmpty()
        .withMessage('অর্ডার আইডি প্রয়োজন')
        .isInt()
        .withMessage('অর্ডার আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('amountPaidByCustomer')
        .notEmpty()
        .withMessage('গ্রাহক কর্তৃক পরিশোধিত পরিমাণ প্রয়োজন')
        .isFloat({ min: 0 })
        .withMessage('পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে'),
    ]
  }
}

export default OrderValidator
