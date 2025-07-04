import { Config } from '@prisma/client'
import prisma from '../../../utils/prisma'

interface ConfigContent {
  [key: string]: any
}

class ConfigServices {
  /**
   * Create or update a config type
   */
  async upsertConfig(type: string, content: ConfigContent): Promise<Config> {
    if (!type || !content) {
      throw new Error('Type and content are required')
    }

    const existingConfig = await prisma.config.findUnique({ where: { type } })

    if (existingConfig) {
      // Update existing config
      return await prisma.config.update({
        where: { type },
        data: {
          content,
          version: existingConfig.version + 1,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new config
      return await prisma.config.create({
        data: {
          type,
          content,
          isActive: true,
          version: 1,
        },
      })
    }
  }

  /**
   * Toggle active status of a config
   */
  async toggleConfig(type: string): Promise<Config> {
    const config = await prisma.config.findUnique({ where: { type } })
    if (!config) {
      throw new Error('Config not found')
    }

    return await prisma.config.update({
      where: { type },
      data: {
        isActive: !config.isActive,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Check if a specific feature is enabled
   */
  async checkFeature(
    type: string,
    feature: string,
  ): Promise<{ enabled: boolean }> {
    const config = await prisma.config.findUnique({ where: { type } })
    if (!config) {
      throw new Error('Config not found')
    }

    if (!config.isActive) {
      return { enabled: false }
    }

    const content = config.content as ConfigContent
    const isEnabled = content[feature] !== false // Default to true if not specified

    return { enabled: isEnabled }
  }

  /**
   * Get all configs (for admin panel)
   */
  async getAllConfigs(): Promise<Config[]> {
    return await prisma.config.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get single config by type
   */
  async getConfig(type: string): Promise<Config> {
    const config = await prisma.config.findUnique({ where: { type } })

    if (!config) {
      throw new Error('Config not found')
    }

    return config
  }
}

export default new ConfigServices()
