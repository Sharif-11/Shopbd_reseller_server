import { Prisma } from '@prisma/client'
import { ErrorRequestHandler } from 'express'
import httpStatus from 'http-status'
import config from '../config'
import ApiError from '../utils/ApiError'
import SmsServiceError from '../utils/SmsServiceError'
import { knownRequestHandler } from './prismaErrorHandler'

interface ErrorResponse {
  statusCode: number
  success: boolean
  message: string
  stack?: string
  errors?: any[]
}

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  let errorResponse: ErrorResponse = {
    statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    success: false,
    message: 'Something went wrong!',
  }

  // Handle known error types
  if (error instanceof ApiError || error instanceof SmsServiceError) {
    errorResponse = {
      statusCode: error.statusCode,
      success: false,
      message: error.message,
    }
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorResponse = {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Database error occurred',
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    errorResponse = {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Validation error occurred',
    }
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    errorResponse = {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Database connection error',
    }
  } else if (error instanceof Error) {
    errorResponse = {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: error.message,
    }
  }

  // Add stack trace and additional details in development
  if (config.env === 'development') {
    errorResponse.stack = error.stack
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorResponse.errors = [error.meta]
      errorResponse.message = knownRequestHandler(error)
    }
  }

  // Send response
  res.status(errorResponse.statusCode).json(errorResponse)
}

export default globalErrorHandler
