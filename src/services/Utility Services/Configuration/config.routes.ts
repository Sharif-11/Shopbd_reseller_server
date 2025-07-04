import { ActionType, PermissionType } from '@prisma/client'
import { NextFunction, Request, Response, Router } from 'express'
import {
  isAuthenticated,
  verifyPermission,
} from '../../../middlewares/auth.middlewares'
import validateRequest from '../../../middlewares/validation.middleware'
import configController from './config.controller'
import ConfigValidator from './config.validators'

class ConfigRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    // Apply authentication middleware to all routes except feature check
    this.router.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        // First authenticate
        await new Promise((resolve, reject) => {
          isAuthenticated(req, res, err => {
            err ? reject(err) : resolve(true)
          })
        })

        // Then verify permissions
        await new Promise((resolve, reject) => {
          verifyPermission(PermissionType.OTHER, ActionType.UPDATE)(
            req,
            res,
            err => {
              err ? reject(err) : resolve(true)
            },
          )
        })

        next()
      } catch (error) {
        next(error)
      }
    })

    // Config management routes
    this.router.post(
      '/',
      ConfigValidator.upsertConfig(),
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => {
        configController.upsertConfig(req, res, next).catch(next)
      },
    )

    this.router.patch(
      '/toggle/:type',
      (req: Request, res: Response, next: NextFunction) => {
        configController.toggleConfig(req, res, next).catch(next)
      },
    )

    this.router.get('/', (req: Request, res: Response, next: NextFunction) => {
      configController.getAllConfigs(req, res, next).catch(next)
    })

    this.router.get(
      '/:type',
      (req: Request, res: Response, next: NextFunction) => {
        configController.getConfig(req, res, next).catch(next)
      },
    )

    // Public feature check route
    this.router.get(
      '/feature/:type/:feature',
      ConfigValidator.featureCheck(),
      validateRequest,
      (req: Request, res: Response, next: NextFunction) => {
        configController.checkFeature(req, res, next).catch(next)
      },
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new ConfigRouter().getRouter()
