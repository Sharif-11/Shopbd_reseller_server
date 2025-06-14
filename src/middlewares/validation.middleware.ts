import { NextFunction, Request, Response } from 'express'
import { validationResult } from 'express-validator'

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  console.log(errors.array())
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0] // Get the first error from the array
    return res.status(400).json({
      statusCode: 400,
      message: firstError.msg, // Use the first error's message
      success: false,
    })
  }
  next()
}

export default validateRequest
