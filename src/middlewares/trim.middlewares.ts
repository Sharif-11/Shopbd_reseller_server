// src/middlewares/trim.middleware.ts
import { NextFunction, Request, Response } from 'express'

function trimRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = deepTrim(req.body)
  }
  if (req.query) {
    req.query = deepTrim(req.query)
  }
  if (req.params) {
    req.params = deepTrim(req.params)
  }
  next()
}

function deepTrim<T>(data: T): T {
  if (typeof data === 'string') {
    return data.trim() as unknown as T
  }

  if (Array.isArray(data)) {
    return data.map(item => deepTrim(item)) as unknown as T
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).reduce(
      (acc, [key, value]) => {
        acc[key] = deepTrim(value)
        return acc
      },
      {} as Record<string, any>,
    ) as unknown as T
  }

  return data
}

export default trimRequestBody
