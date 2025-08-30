import {
  ActionType,
  BlockActionType,
  PermissionType,
  UserType,
} from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'
import { blockServices } from '../services/UserManagement/Block Management/block.services'
import userServices from '../services/UserManagement/user.services'
import ApiError from '../utils/ApiError'
import prisma from '../utils/prisma'

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req?.cookies?.token || req?.headers.authorization?.split(' ')[1]

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
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req?.cookies?.token || req.headers.authorization?.split(' ')[1]
  if (!token) {
    next()
  } else {
    try {
      const payload = jwt.verify(token, config.jwtSecret as string)
      // check if user with userId exists
      const { userId } = payload as any
      const user = await prisma.user.findUnique({
        where: { userId },
      })

      if (!user) {
        next()
      } else {
        req.user = payload as any

        next()
      }
    } catch (error) {
      next(new ApiError(401, 'Unauthorized'))
    }
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

export const verifyPermission = (
  permissionType: PermissionType,
  actionType: ActionType,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ApiError(401, 'Unauthorized')
      }

      // Verify the user has the required permission
      await userServices.verifyUserPermission(
        userId,
        permissionType,
        actionType,
      )

      // If verification succeeds, proceed to next middleware
      next()
    } catch (error) {
      // Pass any errors to the error handling middleware
      next(error)
    }
  }
}
export const verifyAccess = (action: BlockActionType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const phoneNo = req.user?.phoneNo
    const role = req.user?.role

    if (role === 'Seller') {
      if (!phoneNo) {
        return next(new ApiError(401, 'Unauthorized'))
      }
      const isBlocked = await blockServices.isUserBlocked(
        phoneNo,
        action as BlockActionType,
      )

      if (isBlocked) {
        return next(
          new ApiError(403, 'You are blocked from performing this action'),
        )
      }
      next()
    } else {
      try {
        await userServices.verifyUserPermission(
          req.user?.userId!,
          PermissionType.SUPPORT_TICKET_MANAGEMENT,
          ActionType.READ,
        )
        next()
      } catch (error) {
        return next(new ApiError(401, 'Unauthorized'))
      }
    }
  }
}
