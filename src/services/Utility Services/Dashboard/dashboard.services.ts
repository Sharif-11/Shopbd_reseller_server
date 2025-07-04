import { orderService } from '../../Order Services/order.service'
import userServices from '../../UserManagement/user.services'

class Dashboard {
  public async getAdminDashboardData(userId: string) {
    const [userData, salesData] = await Promise.all([
      userServices.getUserStatisticsForAdmin(userId),
      orderService.getOrderStatisticsForAdmin({ adminId: userId }),
    ])
    return { ...userData, ...salesData }
  }
}
export const dashboardService = new Dashboard()
