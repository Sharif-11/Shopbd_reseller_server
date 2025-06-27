import { query } from 'express-validator'

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
}

export default TransactionValidator
