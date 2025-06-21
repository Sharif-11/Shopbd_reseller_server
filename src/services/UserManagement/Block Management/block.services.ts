import {
  ActionType,
  BlockActionType,
  PermissionType,
  Prisma,
} from '@prisma/client'
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
      'READ',
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
      'READ',
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
  public async updateUserBlockActions({
    adminId,
    userPhoneNo,
    actions,
    bySystem = false,
    tx = prisma, // Default to global prisma client
  }: {
    adminId: string
    userPhoneNo: string
    actions: Array<{
      actionType: BlockActionType
      active: boolean
      reason?: string
      expiresAt?: Date | null
    }>
    bySystem?: boolean
    tx?: Prisma.TransactionClient | typeof prisma // Allow passing a transaction client
  }) {
    if (!bySystem) {
      console.log(
        `Admin ${adminId} is updating block actions for user ${userPhoneNo}`,
      )
      await userManagementServices.verifyUserPermission(
        adminId,
        PermissionType.USER_MANAGEMENT,
        ActionType.BLOCK,
      )
    }

    // Always use the provided tx client (or prisma if none provided)
    const user = await tx.user.findUnique({
      where: { phoneNo: userPhoneNo },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // Define the core operation that works with transactions
    const operation = async (tx: Prisma.TransactionClient) => {
      // Find or create the main block record
      let block = await tx.block.findFirst({
        where: { userPhoneNo },
      })

      if (!block) {
        block = await tx.block.create({
          data: {
            userName: user.name,
            userPhoneNo,
            isActive: false,
          },
        })
      }

      // Process each action
      for (const action of actions) {
        if (action.active) {
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
          await tx.blockAction.deleteMany({
            where: {
              blockId: block.blockId,
              actionType: action.actionType,
            },
          })
        }
      }

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
      if (!bySystem) return this.getUserBlockStatus(adminId, userPhoneNo)
    }

    // If we received a tx parameter, use it directly (part of existing transaction)
    // Otherwise, create a new transaction
    return tx === prisma ? prisma.$transaction(operation) : operation(tx)
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
