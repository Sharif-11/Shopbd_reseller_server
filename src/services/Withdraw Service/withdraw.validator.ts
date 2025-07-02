import { WithdrawStatus } from '@prisma/client'
import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'
import config from '../../config'

class WithdrawValidator {
  static createWithdraw(): RequestHandler[] {
    return [
      body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than zero')
        .custom(value => {
          if (value > config.maximumWithdrawAmount) {
            throw new Error(
              `Amount exceeds the maximum withdraw limit of ${config.maximumWithdrawAmount}`,
            )
          }
          return true
        }),
      body('walletName')
        .notEmpty()
        .withMessage('Wallet name is required')
        .isString()
        .withMessage('Wallet name must be a string'),
      body('walletPhoneNo')
        .notEmpty()
        .withMessage('Wallet phone number is required')
        .isString()
        .withMessage('Wallet phone number must be a string')
        .matches(/^01[3-9]\d{8}$/)
        .withMessage('Invalid Bangladeshi mobile number format'),
    ]
  }

  static cancelWithdraw(): RequestHandler[] {
    return [
      param('withdrawId')
        .notEmpty()
        .withMessage('Withdraw ID is required')
        .isString()
        .withMessage('Withdraw ID must be a string'),
    ]
  }

  static approveWithdraw(): RequestHandler[] {
    return [
      param('withdrawId')
        .notEmpty()
        .withMessage('Withdraw ID is required')
        .isString()
        .withMessage('Withdraw ID must be a string'),
      body('systemWalletPhoneNo')
        .notEmpty()
        .withMessage('System wallet phone number is required')
        .isString()
        .withMessage('System wallet phone number must be a string')
        .matches(/^01[3-9]\d{8}$/)
        .withMessage('Invalid Bangladeshi mobile number format'),
      body('transactionId')
        .notEmpty()
        .withMessage('Transaction ID is required')
        .isString()
        .withMessage('Transaction ID must be a string')
        .trim(),
    ]
  }

  static rejectWithdraw(): RequestHandler[] {
    return [
      param('withdrawId')
        .notEmpty()
        .withMessage('Withdraw ID is required')
        .isString()
        .withMessage('Withdraw ID must be a string'),
      body('remarks')
        .optional()
        .isString()
        .withMessage('Remarks must be a string'),
    ]
  }

  static getWithdrawsForSeller(): RequestHandler[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
      query('search')
        .optional()
        .isString()
        .withMessage('Search term must be a string'),
      query('status')
        .optional()
        .custom(value => {
          if (Array.isArray(value)) {
            return value.every(v => Object.values(WithdrawStatus).includes(v))
          }
          return Object.values(WithdrawStatus).includes(value)
        })
        .withMessage('Invalid status value'),
    ]
  }

  static getWithdrawsForAdmin(): RequestHandler[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
      query('search')
        .optional()
        .isString()
        .withMessage('Search term must be a string'),
      query('status')
        .optional()
        .custom(value => {
          if (Array.isArray(value)) {
            return value.every(v => Object.values(WithdrawStatus).includes(v))
          }
          return Object.values(WithdrawStatus).includes(value)
        })
        .withMessage('Invalid status value'),
    ]
  }

  static getWithdrawDetails(): RequestHandler[] {
    return [
      param('withdrawId')
        .notEmpty()
        .withMessage('Withdraw ID is required')
        .isString()
        .withMessage('Withdraw ID must be a string'),
    ]
  }
}

export default WithdrawValidator
