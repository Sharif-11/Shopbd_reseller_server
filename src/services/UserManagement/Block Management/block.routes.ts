// routes/block.route.ts
import { Router } from 'express'
import { isAuthenticated } from '../../../middlewares/auth.middlewares'
import validateRequest from '../../../middlewares/validation.middleware'
import blockController from './block.controller'
import BlockValidator from './block.validator'

class BlockRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Get blocked actions for a specific user
    this.router.get(
      '/:phoneNo',
      isAuthenticated,
      BlockValidator.getBlockedActions(),
      validateRequest,
      blockController.getBlockedActions
    )

    // Update block actions for a user
    this.router.put(
      '/:phoneNo',
      isAuthenticated,
      BlockValidator.updateBlockActions(),
      validateRequest,
      blockController.updateBlockActions
    )

    // Check if user is blocked for specific action
    this.router.get(
      '/check/:phoneNo',
      isAuthenticated,
      BlockValidator.checkBlockStatus(),
      validateRequest,
      blockController.checkBlockStatus
    )

    // Get all blocked users

    // Get block history for a user
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new BlockRouter().getRouter()
