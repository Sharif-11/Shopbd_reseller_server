import { Prisma } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param } from 'express-validator'

class ShopCategoryValidator {
  // ==========================================
  // SHOP MANAGEMENT VALIDATORS
  // ==========================================

  static createShop(): RequestHandler[] {
    return [
      body('shopName')
        .notEmpty()
        .withMessage('দোকানের নাম প্রয়োজন')
        .isString()
        .withMessage('দোকানের নাম অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 3 })
        .withMessage('দোকানের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('shopLocation')
        .notEmpty()
        .withMessage('দোকানের অবস্থান প্রয়োজন')
        .isString()
        .withMessage('দোকানের অবস্থান অবশ্যই স্ট্রিং হতে হবে'),
      body('deliveryChargeInside')
        .notEmpty()
        .withMessage('ভিতরে ডেলিভারি চার্জ প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন')
          }
        }),
      body('deliveryChargeOutside')
        .notEmpty()
        .withMessage('বাইরে ডেলিভারি চার্জ প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন')
          }
        }),
      body('shopDescription')
        .optional()
        .isString()
        .withMessage('দোকানের বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
      body('shopIcon')
        .optional()
        .isURL()
        .withMessage('সঠিক আইকন URL প্রদান করুন'),
    ]
  }

  static getShop(): RequestHandler[] {
    return [
      param('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static updateShop(): RequestHandler[] {
    return [
      param('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে')
        .toInt(),

      // Required fields
      body('shopName')
        .notEmpty()
        .withMessage('দোকানের নাম প্রয়োজন')
        .isString()
        .withMessage('দোকানের নাম অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 3 })
        .withMessage('দোকানের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে')
        .trim(),

      body('shopLocation')
        .notEmpty()
        .withMessage('দোকানের অবস্থান প্রয়োজন')
        .isString()
        .withMessage('দোকানের অবস্থান অবশ্যই স্ট্রিং হতে হবে')
        .trim(),

      body('deliveryChargeInside')
        .notEmpty()
        .withMessage('ভিতরে ডেলিভারি চার্জ প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন')
          }
        }),

      body('deliveryChargeOutside')
        .notEmpty()
        .withMessage('বাইরে ডেলিভারি চার্জ প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক ডেলিভারি চার্জ প্রদান করুন')
          }
        }),

      body('shopDescription')
        .optional()
        .isString()
        .withMessage('দোকানের বিবরণ অবশ্যই স্ট্রিং হতে হবে')
        .trim(),

      // Optional field
      body('shopIcon')
        .optional({ checkFalsy: true }) // Made optional
        .trim()
        .isURL()
        .withMessage('সঠিক আইকন URL প্রদান করুন'),
      body('isActive')
        .notEmpty()
        .withMessage('সক্রিয় অবস্থা প্রয়োজন')
        .isBoolean()
        .withMessage('সক্রিয় অবস্থা অবশ্যই বুলিয়ান হতে হবে')
        .toBoolean(),
    ]
  }
  static openOrCloseShop(): RequestHandler[] {
    return [
      param('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),

      body('isActive')
        .notEmpty()
        .withMessage('সক্রিয় অবস্থা প্রয়োজন')
        .isBoolean()
        .withMessage('সক্রিয় অবস্থা অবশ্যই বুলিয়ান হতে হবে')
        .toBoolean(),
    ]
  }

  // ==========================================
  // CATEGORY MANAGEMENT VALIDATORS
  // ==========================================

  static createCategory(): RequestHandler[] {
    return [
      body('name')
        .notEmpty()
        .withMessage('ক্যাটাগরির নাম প্রয়োজন')
        .isString()
        .withMessage('ক্যাটাগরির নাম অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 3 })
        .withMessage('ক্যাটাগরির নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('description')
        .optional()
        .isString()
        .withMessage('ক্যাটাগরির বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
      body('categoryIcon')
        .optional()
        .isURL()
        .withMessage('সঠিক ক্যাটাগরি আইকন URL প্রদান করুন'),
      body('parentId')
        .optional()
        .isInt()
        .withMessage('প্যারেন্ট ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static getCategory(): RequestHandler[] {
    return [
      param('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt()
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static updateCategory(): RequestHandler[] {
    return [
      param('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt()
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('name')
        .optional()
        .isString()
        .withMessage('ক্যাটাগরির নাম অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 3 })
        .withMessage('ক্যাটাগরির নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('description')
        .optional()
        .isString()
        .withMessage('ক্যাটাগরির বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
      body('categoryIcon')
        .optional()
        .isURL()
        .withMessage('সঠিক ক্যাটাগরি আইকন URL প্রদান করুন'),
      body('parentId')
        .optional({ checkFalsy: true, nullable: true })
        .isInt()
        .withMessage('প্যারেন্ট ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }
  static getCategoriesWithSubcategoriesAndProductCounts(): RequestHandler[] {
    return [
      param('parentId')
        .optional({
          checkFalsy: true,
          nullable: true,
        })
        .isInt()
        .withMessage('প্যারেন্ট ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static deleteCategory(): RequestHandler[] {
    return [
      param('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt()
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  // ==========================================
  // SHOP-CATEGORY ASSIGNMENT VALIDATORS
  // ==========================================

  static assignCategoryToShop(): RequestHandler[] {
    return [
      body('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt()
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static removeCategoryFromShop(): RequestHandler[] {
    return [
      param('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
      param('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt()
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static getShopCategories(): RequestHandler[] {
    return [
      param('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt()
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static getShopsByCategory(): RequestHandler[] {
    return [
      param('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt()
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }
}

export default ShopCategoryValidator
