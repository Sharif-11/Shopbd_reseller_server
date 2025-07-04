import { NextFunction, Request, Response } from 'express'
import configServices from './config.services'

class ConfigController {
  /**
   * Create or update a config type
   */
  async upsertConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, content } = req.body

      const config = await configServices.upsertConfig(type, content)

      return res.status(config.version === 1 ? 201 : 200).json({
        statusCode: config.version === 1 ? 201 : 200,
        message: `Config ${config.version === 1 ? 'created' : 'updated'} successfully`,
        success: true,
        data: config,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Toggle active status of a config
   */
  async toggleConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params

      const config = await configServices.toggleConfig(type)

      return res.status(200).json({
        statusCode: 200,
        message: 'Config status toggled successfully',
        success: true,
        data: config,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Check if a specific feature is enabled
   */
  async checkFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, feature } = req.params

      const { enabled } = await configServices.checkFeature(type, feature)

      return res.status(200).json({
        statusCode: 200,
        message: 'Feature status checked',
        success: true,
        data: { enabled },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all configs (for admin panel)
   */
  async getAllConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await configServices.getAllConfigs()
      return res.status(200).json({
        statusCode: 200,
        message: 'Configs fetched successfully',
        success: true,
        data: configs,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get single config by type
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params
      const config = await configServices.getConfig(type)

      return res.status(200).json({
        statusCode: 200,
        message: 'Config fetched successfully',
        success: true,
        data: config,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new ConfigController()
