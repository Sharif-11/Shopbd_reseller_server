import { UserType } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'
import ApiError from '../utils/ApiError'
import prisma from '../utils/prisma'

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  // console.log({meta:req?.body?.meta})
  if (!token) {
    return next(new ApiError(401, 'Unauthorized'))
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret as string)
    // check if user with userId exists
    const { userId } = payload as any
    const user = await prisma.user.findUnique({
      where: { userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    req.user = payload as any

    next()
  } catch (error) {
    next(new ApiError(401, 'Unauthorized'))
  }
}
export const verifyRole = (role: UserType | UserType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role) {
      return next(new ApiError(401, 'Unauthorized'))
    }
    if (
      Array.isArray(role)
        ? !role.includes(req.user?.role as UserType)
        : req.user?.role !== role
    ) {
      return next(new ApiError(403, 'Forbidden'))
    }
    next()
  }
}
