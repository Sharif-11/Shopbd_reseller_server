import { ActionType, BlockActionType, PermissionType } from '@prisma/client'
import ApiError from '../../../utils/ApiError'
import prisma from '../../../utils/prisma'
import userManagementServices from '../../UserManagement/user.services'

class BlockService {
  /**
   * Get all block actions for a user with their individual attributes
   */
  public async getAllBlockActions(adminId: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      'READ'
    )
    const blocks = Object.values(BlockActionType)

    // convert the prisma block actions to an array of string
    const blockActions = blocks.map(action => action.toString())
    return blockActions
  }
  public async getUserBlockStatus(adminId: string, userPhoneNo: string) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      'READ'
    )

    const user = await prisma.user.findUnique({
      where: { phoneNo: userPhoneNo },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const block = await prisma.block.findFirst({
      where: {
        userPhoneNo,
        isActive: true,
      },
      include: {
        actions: true,
      },
    })

    return {
      user: {
        name: user.name,
        phoneNo: userPhoneNo,
        userId: user.userId,
      },

      blockId: block?.blockId,
      actions: (block?.actions ?? []).map(action => action.actionType),
    }
  }

  /**
   * Update block actions for a user with individual attributes
   */
  public async updateUserBlockActions(
    adminId: string,
    userPhoneNo: string,
    actions: Array<{
      actionType: BlockActionType
      active: boolean
      reason?: string
      expiresAt?: Date | null
    }>
  ) {
    await userManagementServices.verifyUserPermission(
      adminId,
      PermissionType.USER_MANAGEMENT,
      ActionType.BLOCK
    )

    const user = await prisma.user.findUnique({
      where: { phoneNo: userPhoneNo },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    return await prisma.$transaction(async tx => {
      // Find or create the main block record
      let block = await tx.block.findFirst({
        where: { userPhoneNo },
      })

      if (!block) {
        block = await tx.block.create({
          data: {
            userName: user.name,
            userPhoneNo,
            isActive: false, // Will be activated if any actions are added
          },
        })
      }

      // Process each action
      for (const action of actions) {
        if (action.active) {
          // Upsert the action (create or update)
          await tx.blockAction.upsert({
            where: {
              blockId_actionType: {
                blockId: block.blockId,
                actionType: action.actionType,
              },
            },
            create: {
              blockId: block.blockId,
              actionType: action.actionType,
              reason: action.reason,
              expiresAt: action.expiresAt,
            },
            update: {
              reason: action.reason,
              expiresAt: action.expiresAt,
            },
          })
        } else {
          // Remove the action if it exists
          await tx.blockAction.deleteMany({
            where: {
              blockId: block.blockId,
              actionType: action.actionType,
            },
          })
        }
      }

      // Update the block's active status based on whether it has any actions
      const actionCount = await tx.blockAction.count({
        where: { blockId: block.blockId },
      })

      await tx.block.update({
        where: { blockId: block.blockId },
        data: {
          isActive: actionCount > 0,
          updatedAt: new Date(),
        },
      })

      return this.getUserBlockStatus(adminId, userPhoneNo)
    })
  }

  /**
   * Check if a user is blocked for a specific action
   */
  async isUserBlocked(userPhoneNo: string, actionType: BlockActionType) {
    const result = await prisma.blockAction.findFirst({
      where: {
        block: {
          userPhoneNo,
          isActive: true,
        },
        actionType: {
          in: [actionType, BlockActionType.ALL], // Check for specific action or ALL
        },
        OR: [
          { expiresAt: { gt: new Date() } },
          { expiresAt: null }, // Never-expiring blocks
        ],
      },
      select: {
        reason: true,
        expiresAt: true,
      },
    })
    return !!result
  }

  /**
   * Get all blocked users with their actions
   */
}
export const blockServices = new BlockService()
