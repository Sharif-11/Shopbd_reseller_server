// dashboard.route.ts
import { Router } from 'express'
import { isAuthenticated } from '../../../middlewares/auth.middlewares'
import dashboardController from './dashboard.controller'

class DashboardRouter {
  protected router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Get admin dashboard data
    this.router.get(
      '/admin',
      isAuthenticated,
      dashboardController.getAdminDashboardData,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new DashboardRouter().getRouter()
