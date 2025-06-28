import { ActionType, PermissionType, Prisma } from '@prisma/client'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import userServices from '../UserManagement/user.services'

export class CommissionService {
  private static validateCommissionRanges(
    data: {
      startPrice: number
      endPrice: number | null
      commission: number
      level: number
    }[],
  ): void {
    // Check for empty data
    if (data.length === 0) {
      throw new ApiError(400, 'Commission data not provided')
    }

    // Check for non-positive values
    for (const row of data) {
      if (row.startPrice <= 0) {
        throw new ApiError(
          400,
          `Start price must be positive (found ${row.startPrice})`,
        )
      }

      if (row.endPrice !== null && row.endPrice <= 0) {
        throw new ApiError(
          400,
          `End price must be positive (found ${row.endPrice})`,
        )
      }

      if (row.commission < 0) {
        throw new ApiError(400, `Commission amount can not be negative`)
      }

      if (row.level <= 0) {
        throw new ApiError(400, `Level must be positive (found ${row.level})`)
      }
    }

    // Group by level to validate each level's ranges
    const levels = new Map<number, typeof data>()
    for (const row of data) {
      if (!levels.has(row.level)) {
        levels.set(row.level, [])
      }
      levels.get(row.level)?.push(row)
    }

    // Validate each level's ranges
    for (const [level, levelRanges] of levels) {
      // Sort ranges by startPrice
      const sortedRanges = [...levelRanges].sort(
        (a, b) => a.startPrice - b.startPrice,
      )

      // Check first range starts from 1
      const firstRange = sortedRanges[0]
      if (firstRange.startPrice !== 1) {
        throw new ApiError(
          400,
          `First price range for level ${level} must start from 1 (found ${firstRange.startPrice})`,
        )
      }

      // Check that only the last range has null endPrice
      const openEndedRanges = sortedRanges.filter(r => r.endPrice === null)
      if (
        openEndedRanges.length !== 1 ||
        openEndedRanges[0] !== sortedRanges[sortedRanges.length - 1]
      ) {
        throw new ApiError(
          400,
          `Only the last price range for level ${level} can be open-ended (null endPrice)`,
        )
      }

      // Check for continuous ranges without gaps
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        const current = sortedRanges[i]
        const next = sortedRanges[i + 1]

        if (current.endPrice === null) {
          throw new ApiError(400, 'Only the last range can be open-ended')
        }

        if (current.endPrice !== next.startPrice) {
          throw new ApiError(
            400,
            `Price ranges must be continuous for level ${level}: ` +
              `Range ${current.startPrice}-${current.endPrice} must connect to ` +
              `range ${next.startPrice}-${next.endPrice}`,
          )
        }
      }
    }
  }

  private static transformToDatabaseFormat(
    data: {
      startPrice: number
      endPrice: number | null
      commission: number
      level: number
    }[],
  ): Prisma.CommissionCreateManyInput[] {
    return data.map(row => ({
      startPrice: new Prisma.Decimal(row.startPrice),
      endPrice: row.endPrice !== null ? new Prisma.Decimal(row.endPrice) : null,
      level: row.level,
      commission: new Prisma.Decimal(row.commission),
    }))
  }

  async replaceCommissionTable(
    adminId: string,
    data: {
      startPrice: number
      endPrice: number | null
      commission: number
      level: number
    }[],
  ): Promise<
    {
      startPrice: number
      endPrice: number | null
      commission: number
      level: number
    }[]
  > {
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.OTHER,
      ActionType.ALL,
    )
    // Validate input data
    CommissionService.validateCommissionRanges(data)

    // Transform to database format
    const commissionEntries = CommissionService.transformToDatabaseFormat(data)

    // Transaction for atomic replacement
    return await prisma.$transaction(async tx => {
      // Clear existing data
      await tx.commission.deleteMany()

      // Insert new data
      await tx.commission.createMany({
        data: commissionEntries,
      })

      // Return the newly created data
      return this.formatCommissionTable(
        await tx.commission.findMany({
          orderBy: [{ level: 'asc' }, { startPrice: 'asc' }],
        }),
      )
    })
  }

  private formatCommissionTable(
    commissions: {
      startPrice: Prisma.Decimal
      endPrice: Prisma.Decimal | null
      level: number
      commission: Prisma.Decimal
    }[],
  ): {
    startPrice: number
    endPrice: number | null
    commission: number
    level: number
  }[] {
    return commissions.map(c => ({
      startPrice: c.startPrice.toNumber(),
      endPrice: c.endPrice?.toNumber() ?? null,
      level: c.level,
      commission: c.commission.toNumber(),
    }))
  }

  async getCommissionTable(): Promise<
    {
      startPrice: number
      endPrice: number | null
      commission: number
      level: number
    }[]
  > {
    const commissions = await prisma.commission.findMany({
      orderBy: [{ level: 'asc' }, { startPrice: 'asc' }],
    })
    return this.formatCommissionTable(commissions)
  }

  async getCommissionByPriceAndLevel(
    price: number,
    level: number,
  ): Promise<number> {
    if (price <= 0) {
      throw new ApiError(400, 'Price must be positive')
    }

    const commission = await prisma.commission.findFirst({
      where: {
        level,
        startPrice: { lte: price },
        OR: [
          { endPrice: { gte: price } },
          { endPrice: null }, // For open-ended ranges
        ],
      },
    })

    if (!commission) {
      throw new ApiError(
        404,
        `No commission found for price ${price} at level ${level}`,
      )
    }

    return commission.commission.toNumber()
  }

  async calculateUserCommissions(
    userPhone: string,
    price: number,
    tx: Prisma.TransactionClient = prisma,
  ) {
    if (price <= 0) {
      throw new ApiError(400, 'Price must be positive')
    }

    const parentTree = await this.getUserParentTree(userPhone, tx)

    const result = await Promise.all(
      parentTree.map(async parent => ({
        phoneNo: parent.phoneNo,
        name: parent.name,
        level: parent.level,
        userId: parent.userId,
        commissionAmount: await this.getCommissionByPriceAndLevel(
          price,
          parent.level,
        ),
      })),
    )

    // Filter out users with zero commission
    return result.filter(user => user.commissionAmount > 0)
  }

  private async getUserParentTree(
    userPhone: string,
    tx: Prisma.TransactionClient = prisma,
  ) {
    return await tx.$queryRaw<
      { phoneNo: string; name: string; level: number; userId: string }[]
    >`
      WITH RECURSIVE parent_tree AS (
        SELECT 
          "phoneNo", 
          "name", 
          "userId",
          0 AS "level", 
          "referredByPhone"
        FROM "users"
        WHERE "phoneNo" = ${userPhone}
        
        UNION ALL
        
        SELECT 
          u."phoneNo", 
          u."name", 
          u."userId",
          pt."level" + 1 AS "level", 
          u."referredByPhone"
        FROM "users" u
        JOIN parent_tree pt ON u."phoneNo" = pt."referredByPhone"
      )
      SELECT 
        "phoneNo", 
        "name", 
        "level",
        "userId"
      FROM parent_tree
      WHERE "phoneNo" != ${userPhone}
      ORDER BY "level"
    `
  }
}

export default new CommissionService()
