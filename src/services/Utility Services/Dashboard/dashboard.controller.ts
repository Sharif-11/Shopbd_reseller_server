// dashboard.controller.ts
import { NextFunction, Request, Response } from 'express'
import { dashboardService } from './dashboard.services'

class DashboardController {
  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId

      const dashboardData = await dashboardService.getAdminDashboardData(
        adminId!,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Dashboard data retrieved successfully',
        success: true,
        data: dashboardData,
      })
    } catch (error) {
      next(error)
    }
  }
  /**
   * Get reseller dashboard statistics
   */
  async getResellerDashboardData(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const resellerId = req.user?.userId

      const dashboardData = await dashboardService.getResellerDashboardData(
        resellerId!,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Dashboard data retrieved successfully',
        success: true,
        data: dashboardData,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new DashboardController()
