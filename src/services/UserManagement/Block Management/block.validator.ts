import { body, param, query } from 'express-validator'

class BlockValidator {
  static getBlockedActions() {
    return [
      param('phoneNo')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    ]
  }

  static updateBlockActions() {
    return [
      param('phoneNo')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
      body('actions')
        .isArray({ min: 1 })
        .withMessage('At least one action is required'),
      body('actions.*.actionType')
        .notEmpty()
        .withMessage('Action type is required'),
      body('actions.*.active')
        .isBoolean()
        .withMessage('Active status must be boolean'),
      body('actions.*.reason')
        .optional()
        .isString()
        .withMessage('Reason must be a string'),
      body('actions.*.expiresAt')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    ]
  }

  static checkBlockStatus() {
    return [
      param('phoneNo')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
      query('actionType').notEmpty().withMessage('Action type is required'),
    ]
  }

  static getAllBlockedUsers() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    ]
  }

  static getBlockHistory() {
    return [
      param('phoneNo')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1-100'),
    ]
  }
}

export default BlockValidator
