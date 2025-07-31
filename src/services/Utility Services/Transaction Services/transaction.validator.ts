import { body, param, query } from 'express-validator'

class TransactionValidator {
  /**
   * Validation rules for getting user transactions
   */
  static getUserTransactions() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .trim(),
    ]
  }

  /**
   * Validation rules for getting all transactions (admin)
   */
  static getAllTransactions() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .trim(),
    ]
  }
  static updateBalanceByAdminToSeller() {
    return [
      param('sellerId')
        .trim()
        .notEmpty()
        .withMessage('Seller ID is required')
        .isString()
        .withMessage('Seller ID must be a string')
        .escape(),

      body('amount')
        .exists()
        .withMessage('Amount is required')
        .isFloat({ gt: 0 })
        .withMessage('Amount must be a positive number')
        .toFloat(),

      body('reason')
        .trim()
        .notEmpty()
        .withMessage('Reason is required')
        .isString()
        .withMessage('Reason must be a string')
        .isLength({ min: 10, max: 255 })
        .withMessage('Reason must be between 10 and 255 characters')
        .escape(),

      // You might also want to validate transactionType if it's in the body
      body('transactionType')
        .optional() // or .exists() if it's required
        .isIn(['add', 'deduct'])
        .withMessage('Transaction type must be either "add" or "deduct"'),
    ]
  }
}

export default TransactionValidator
