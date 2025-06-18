import { Prisma } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'

class ProductValidator {
  // ==========================================
  // PRODUCT CRUD VALIDATORS
  // ==========================================

  static createProduct(): RequestHandler[] {
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
      body('name')
        .notEmpty()
        .withMessage('পণ্যের নাম প্রয়োজন')
        .isString()
        .withMessage('পণ্যের নাম অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 3 })
        .withMessage('পণ্যের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('description')
        .notEmpty()
        .withMessage('পণ্যের বিবরণ প্রয়োজন')
        .isString()
        .withMessage('পণ্যের বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
      body('basePrice')
        .notEmpty()
        .withMessage('মূল্য প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক মূল্য প্রদান করুন')
          }
        }),
      body('suggestedMaxPrice')
        .notEmpty()
        .withMessage('সুপারিশকৃত সর্বোচ্চ মূল্য প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক সুপারিশকৃত সর্বোচ্চ মূল্য প্রদান করুন')
          }
        })
        .custom((value, { req }) => {
          const basePrice = new Prisma.Decimal(req.body.basePrice)
          const suggestedMaxPrice = new Prisma.Decimal(value)
          if (suggestedMaxPrice.lessThan(basePrice)) {
            throw new Error(
              'সুপারিশকৃত সর্বোচ্চ মূল্য বেস মূল্যের চেয়ে বেশি হতে হবে',
            )
          }
          return true
        }),
    ]
  }

  static getProductDetailForAdmin(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static updateProduct(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
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
      body('name')
        .notEmpty()
        .withMessage('পণ্যের নাম প্রয়োজন')
        .isString()
        .withMessage('পণ্যের নাম অবশ্যই স্ট্রিং হতে হবে')
        .isLength({ min: 3 })
        .withMessage('পণ্যের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
      body('description')
        .notEmpty()
        .withMessage('পণ্যের বিবরণ প্রয়োজন')
        .isString()
        .withMessage('পণ্যের বিবরণ অবশ্যই স্ট্রিং হতে হবে'),
      body('basePrice')
        .notEmpty()
        .withMessage('মূল্য প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক মূল্য প্রদান করুন')
          }
        }),
      body('suggestedMaxPrice')
        .notEmpty()
        .withMessage('সুপারিশকৃত সর্বোচ্চ মূল্য প্রয়োজন')
        .custom(value => {
          try {
            new Prisma.Decimal(value)
            return true
          } catch {
            throw new Error('সঠিক সুপারিশকৃত সর্বোচ্চ মূল্য প্রদান করুন')
          }
        })
        .custom((value, { req }) => {
          const basePrice = new Prisma.Decimal(req.body.basePrice)
          const suggestedMaxPrice = new Prisma.Decimal(value)
          if (suggestedMaxPrice.lessThan(basePrice)) {
            throw new Error(
              'সুপারিশকৃত সর্বোচ্চ মূল্য বেস মূল্যের চেয়ে বেশি হতে হবে',
            )
          }
          return true
        }),
      body('published')
        .optional()
        .isBoolean()
        .withMessage('প্রকাশিত স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে'),
    ]
  }

  static togglePublishStatus(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('publish')
        .notEmpty()
        .withMessage('প্রকাশনার অবস্থা প্রয়োজন')
        .isBoolean()
        .withMessage('প্রকাশনার অবস্থা অবশ্যই বুলিয়ান হতে হবে'),
    ]
  }

  // ==========================================
  // VARIANT MANAGEMENT VALIDATORS
  // ==========================================

  static getProductVariants(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static replaceVariants(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('variants')
        .isArray()
        .withMessage('ভ্যারিয়েন্ট অবশ্যই অ্যারে হতে হবে')
        .custom(variants => {
          if (!variants.every((v: any) => v.name && v.value)) {
            throw new Error('প্রতিটি ভ্যারিয়েন্টে নাম এবং মান থাকতে হবে')
          }
          return true
        }),
    ]
  }

  // ==========================================
  // IMAGE MANAGEMENT VALIDATORS
  // ==========================================

  static addImages(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('images')
        .isArray({ min: 1 })
        .withMessage('অন্তত একটি ইমেজ প্রয়োজন')
        .custom(images => {
          const primaryCount = images.filter((img: any) => img.isPrimary).length
          if (primaryCount !== 1) {
            throw new Error('ঠিক একটি ইমেজ প্রাইমারি হিসেবে চিহ্নিত হতে হবে')
          }
          return true
        })
        .custom(images => {
          if (!images.every((img: any) => img.url)) {
            throw new Error('প্রতিটি ইমেজে URL থাকতে হবে')
          }
          return true
        }),
    ]
  }

  static getImages(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static updateImage(): RequestHandler[] {
    return [
      param('imageId')
        .notEmpty()
        .withMessage('ইমেজ আইডি প্রয়োজন')
        .isInt()
        .withMessage('ইমেজ আইডি অবশ্যই সংখ্যা হতে হবে'),
      body('isPrimary')
        .optional()
        .isBoolean()
        .withMessage('প্রাইমারি স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে'),
      body('hidden')
        .optional()
        .isBoolean()
        .withMessage('লুকানো স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে'),
    ]
  }

  static deleteImage(): RequestHandler[] {
    return [
      param('imageId')
        .notEmpty()
        .withMessage('ইমেজ আইডি প্রয়োজন')
        .isInt()
        .withMessage('ইমেজ আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static deleteAllImages(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  // ==========================================
  // PRODUCT VIEW VALIDATORS
  // ==========================================

  static getProductDetailForCustomer(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  static getProductDetailForSeller(): RequestHandler[] {
    return [
      param('productId')
        .notEmpty()
        .withMessage('পণ্য আইডি প্রয়োজন')
        .isInt()
        .withMessage('পণ্য আইডি অবশ্যই সংখ্যা হতে হবে'),
    ]
  }

  // ==========================================
  // PRODUCT LISTING VALIDATORS
  // ==========================================

  // ==========================================
  // PRODUCT LISTING VALIDATORS
  // ==========================================

  static getAllProductsForAdmin(): RequestHandler[] {
    return [
      query('search')
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
      query('shopId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে')
        .toInt(),
      // query('categoryId')
      //   .optional()
      //   .isInt({ min: 1 })
      //   .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে')
      //   .toInt(),
      query('published')
        .optional()
        .isBoolean()
        .withMessage('প্রকাশিত স্ট্যাটাস অবশ্যই বুলিয়ান হতে হবে')
        .toBoolean(),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ এর বেশি হতে হবে')
        .default(1)
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('সীমা অবশ্যই ১ থেকে ১০০০ এর মধ্যে হতে হবে')
        .default(10)
        .toInt(),
    ]
  }

  static getAllProductsForCustomer(): RequestHandler[] {
    return [
      query('search')
        .optional()
        .isString()
        .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
      query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('ন্যূনতম মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
        .toFloat(),
      query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('সর্বোচ্চ মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
        .toFloat()
        .custom((value, { req }) => {
          if (req.query?.minPrice && value < Number(req.query.minPrice)) {
            throw new Error('সর্বোচ্চ মূল্য ন্যূনতম মূল্যের চেয়ে বেশি হতে হবে')
          }
          return true
        }),
      query('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt({ min: 1 })
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে')
        .toInt(),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ এর বেশি হতে হবে')
        .default(1)
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে')
        .default(10)
        .toInt(),
    ]
  }

  static getAllProductsForSeller(): RequestHandler[] {
    return [
      query('search')
        .optional()
        .isString()
        .withMessage('অনুসন্ধান শব্দ অবশ্যই স্ট্রিং হতে হবে'),
      query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('ন্যূনতম মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
        .toFloat(),
      query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('সর্বোচ্চ মূল্য অবশ্যই ০ বা তার বেশি হতে হবে')
        .toFloat()
        .custom((value, { req }) => {
          if (req.query?.minPrice && value < Number(req.query.minPrice)) {
            throw new Error('সর্বোচ্চ মূল্য ন্যূনতম মূল্যের চেয়ে বেশি হতে হবে')
          }
          return true
        }),
      query('categoryId')
        .notEmpty()
        .withMessage('ক্যাটাগরি আইডি প্রয়োজন')
        .isInt({ min: 1 })
        .withMessage('ক্যাটাগরি আইডি অবশ্যই সংখ্যা হতে হবে')
        .toInt(),
      query('shopId')
        .notEmpty()
        .withMessage('দোকান আইডি প্রয়োজন')
        .isInt({ min: 1 })
        .withMessage('দোকান আইডি অবশ্যই সংখ্যা হতে হবে')
        .toInt(),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('পৃষ্ঠা সংখ্যা অবশ্যই ১ এর বেশি হতে হবে')
        .default(1)
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('সীমা অবশ্যই ১ থেকে ১০০ এর মধ্যে হতে হবে')
        .default(10)
        .toInt(),
    ]
  }
}

export default ProductValidator
