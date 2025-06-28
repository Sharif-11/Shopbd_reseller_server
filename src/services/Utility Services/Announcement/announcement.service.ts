import { ActionType, PermissionType } from '@prisma/client'
import ApiError from '../../../utils/ApiError'
import prisma from '../../../utils/prisma'
import userServices from '../../UserManagement/user.services'

export class AnnouncementService {
  private async ensureSingleRowExists() {
    const existing = await prisma.announcements.findFirst()
    if (!existing) {
      await prisma.announcements.create({
        data: {
          announcements: [],
        },
      })
    }
  }

  async replaceAllAnnouncements(adminId: string, newAnnouncements: string[]) {
    await userServices.verifyUserPermission(
      adminId,
      PermissionType.OTHER,
      ActionType.ALL,
    )
    try {
      // Ensure the single row exists
      await this.ensureSingleRowExists()

      // Get the existing record (we know it exists after ensureSingleRowExists)
      const existing = await prisma.announcements.findFirstOrThrow()

      // Completely replace the announcements array
      const updated = await prisma.announcements.update({
        where: { id: existing.id },
        data: {
          announcements: newAnnouncements,
        },
      })

      return updated.announcements
    } catch (error) {
      throw new ApiError(400, 'Failed to update announcements')
    }
  }

  async getCurrentAnnouncements() {
    try {
      await this.ensureSingleRowExists()
      const result = await prisma.announcements.findFirstOrThrow()
      return result.announcements
    } catch (error) {
      throw new ApiError(400, 'Failed to fetch announcements')
    }
  }
}

export default new AnnouncementService()
