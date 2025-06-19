import { NextFunction, Request, Response } from 'express'

import { BlockActionType } from '@prisma/client'
import { blockServices } from './block.services'

class BlockController {
  /**
   * Get all blocked actions for a user
   */
  async getBlockedActions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { phoneNo } = req.params

      const blockedActions = await blockServices.getUserBlockStatus(
        adminId!,
        phoneNo
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Blocked actions retrieved successfully',
        success: true,
        data: blockedActions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user block actions (single endpoint for both block/unblock)
   */
  async updateBlockActions(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId
      const { phoneNo } = req.params
      const { actions } = req.body
      console.log(actions)

      const result = await blockServices.updateUserBlockActions(
        adminId!,
        phoneNo,
        actions
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Block actions updated successfully',
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * Check if user is blocked for specific action
   */
  async checkBlockStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNo } = req.params
      const { actionType } = req.query

      const isBlocked = await blockServices.isUserBlocked(
        phoneNo,
        actionType as BlockActionType
      )

      res.status(200).json({
        statusCode: 200,
        message: isBlocked ? 'User is blocked' : 'User is not blocked',
        success: true,
        data: isBlocked,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all blocked users
   */

  /**
   * Get block history for a user
   */
}

export default new BlockController()
