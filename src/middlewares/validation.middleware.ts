import { RequestHandler } from 'express'
import { validationResult } from 'express-validator'

const validateRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req)
  console.log(errors.array())

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0]
    res.status(400).json({
      statusCode: 400,
      message: firstError.msg,
      success: false,
    })
    return
  }

  next()
}

export default validateRequest
