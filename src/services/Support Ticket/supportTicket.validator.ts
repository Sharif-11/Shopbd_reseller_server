import { RequestHandler } from 'express'
import { body, param, query } from 'express-validator'

class SupportTicketValidator {
  static createTicket(): RequestHandler[] {
    return [
      body('subject')
        .notEmpty()
        .withMessage('Subject is required')
        .isString()
        .withMessage('Subject must be a string')
        .isLength({ max: 200 })
        .withMessage('Subject must be less than 200 characters'),

      body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isIn([
          'ACCOUNT',
          'PAYMENT',
          'ORDER',
          'PRODUCT',
          'WITHDRAWAL',
          'TECHNICAL',
          'OTHER',
        ])
        .withMessage('Invalid ticket category'),

      body('priority')
        .optional()
        .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
        .withMessage('Invalid ticket priority'),

      body('message')
        .notEmpty()
        .withMessage('Message is required')
        .isString()
        .withMessage('Message must be a string')
        .isLength({ max: 2000 })
        .withMessage('Message must be less than 2000 characters'),

      body('attachmentUrls')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 attachments allowed')
        .custom((urls: string[]) => {
          if (urls) {
            for (const url of urls) {
              if (!url.match(/^https?:\/\/.+/)) {
                throw new Error('Invalid attachment URL format')
              }
            }
          }
          return true
        }),

      body('orderId')
        .optional()
        .isString()
        .withMessage('Order ID must be a string'),
      body('paymentId')
        .optional()
        .isString()
        .withMessage('Payment ID must be a string'),
      body('productId')
        .optional()
        .isString()
        .withMessage('Product ID must be a string'),
    ]
  }

  static replyToTicket(): RequestHandler[] {
    return [
      body('ticketId')
        .notEmpty()
        .withMessage('Ticket ID is required')
        .isString()
        .withMessage('Ticket ID must be a string'),

      body('message')
        .notEmpty()
        .withMessage('Message is required')
        .isString()
        .withMessage('Message must be a string')
        .isLength({ max: 2000 })
        .withMessage('Message must be less than 2000 characters'),

      body('attachmentUrls')
        .optional()
        .isArray({ max: 5 })
        .withMessage('Maximum 5 attachments allowed')
        .custom((urls: string[]) => {
          if (urls) {
            for (const url of urls) {
              if (!url.match(/^https?:\/\/.+/)) {
                throw new Error('Invalid attachment URL format')
              }
            }
          }
          return true
        }),
    ]
  }

  static closeTicket(): RequestHandler[] {
    return [
      param('ticketId')
        .notEmpty()
        .withMessage('Ticket ID is required')
        .isString()
        .withMessage('Ticket ID must be a string'),
    ]
  }

  static getTicketDetails(): RequestHandler[] {
    return [
      param('ticketId')
        .notEmpty()
        .withMessage('Ticket ID is required')
        .isString()
        .withMessage('Ticket ID must be a string'),
    ]
  }

  static getUserTickets(): RequestHandler[] {
    return [
      query('status')
        .optional()
        .custom(value => {
          if (Array.isArray(value)) {
            return value.every(v =>
              [
                'OPEN',
                'IN_PROGRESS',
                'WAITING_RESPONSE',
                'RESOLVED',
                'CLOSED',
              ].includes(v),
            )
          }
          return [
            'OPEN',
            'IN_PROGRESS',
            'WAITING_RESPONSE',
            'RESOLVED',
            'CLOSED',
          ].includes(value)
        })
        .withMessage('Invalid ticket status'),

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
        .withMessage('Search term must be a string'),
    ]
  }

  static getAllTickets(): RequestHandler[] {
    return [
      query('status')
        .optional()
        .custom(value => {
          if (Array.isArray(value)) {
            return value.every(v =>
              [
                'OPEN',
                'IN_PROGRESS',
                'WAITING_RESPONSE',
                'RESOLVED',
                'CLOSED',
              ].includes(v),
            )
          }
          return [
            'OPEN',
            'IN_PROGRESS',
            'WAITING_RESPONSE',
            'RESOLVED',
            'CLOSED',
          ].includes(value)
        })
        .withMessage('Invalid ticket status'),

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
        .withMessage('Search term must be a string'),
      query('priority')
        .optional()
        .custom(value => {
          if (Array.isArray(value)) {
            return value.every(v =>
              ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(v),
            )
          }
          return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(value)
        })
        .withMessage('Invalid ticket priority'),
      query('category')
        .optional()
        .custom(value => {
          if (Array.isArray(value)) {
            return value.every(v =>
              [
                'ACCOUNT',
                'PAYMENT',
                'ORDER',
                'PRODUCT',
                'WITHDRAWAL',
                'TECHNICAL',
                'OTHER',
              ].includes(v),
            )
          }
          return [
            'ACCOUNT',
            'PAYMENT',
            'ORDER',
            'PRODUCT',
            'WITHDRAWAL',
            'TECHNICAL',
            'OTHER',
          ].includes(value)
        })
        .withMessage('Invalid ticket category'),
    ]
  }
}

export default SupportTicketValidator
