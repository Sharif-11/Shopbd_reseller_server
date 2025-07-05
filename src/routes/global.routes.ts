import { Router } from 'express'
import authRoute from '../services/Auth/auth.route'
import commissionRoute from '../services/Commission Management/commission.route'
import ftpRoutes from '../services/FtpFileUpload/ftp.routes'
import orderRoutes from '../services/Order Services/order.routes'
import paymentRoutes from '../services/Payment Service/payment.routes'
import productRoutes from '../services/ProductManagement/product.routes'
import {
  categoryRouter,
  shopCategoryAssignmentRouter,
  shopRouter,
} from '../services/ProductManagement/shopCategory.routes'
import supportTicketRoutes from '../services/Support Ticket/supportTicket.routes'
import blockRoutes from '../services/UserManagement/Block Management/block.routes'
import roleRoutes from '../services/UserManagement/Role Management/role.routes'
import announcementRoutes from '../services/Utility Services/Announcement/announcement.routes'
import configRoutes from '../services/Utility Services/Configuration/config.routes'
import dashboardRoutes from '../services/Utility Services/Dashboard/dashboard.routes'
import smsRoutes from '../services/Utility Services/Sms Service/sms.routes'
import transactionRoutes from '../services/Utility Services/Transaction Services/transaction.routes'
import walletRoutes from '../services/WalletManagement/wallet.routes'
import withdrawRoutes from '../services/Withdraw Service/withdraw.routes'

class GlobalRoutes {
  private router: Router
  private routes: Array<{ path: string; route: Router }>

  constructor() {
    this.router = Router()
    this.routes = [
      // { path: '/', route: usersRouter },
      { path: '/auth', route: authRoute },
      { path: '/wallets', route: walletRoutes },
      { path: '/shops', route: shopRouter },
      { path: '/block', route: blockRoutes },
      { path: '/roles', route: roleRoutes },
      { path: '/sms', route: smsRoutes },
      { path: '/categories', route: categoryRouter },
      { path: '/shop-categories', route: shopCategoryAssignmentRouter },
      {
        path: '/products',
        route: productRoutes,
      },
      {
        path: '/ftp',
        route: ftpRoutes,
      },
      {
        path: '/orders',
        route: orderRoutes,
      },
      {
        path: '/withdraws',
        route: withdrawRoutes,
      },
      {
        path: '/payments',
        route: paymentRoutes,
      },
      {
        path: '/transactions',
        route: transactionRoutes,
      },
      {
        path: '/commissions',
        route: commissionRoute,
      },
      {
        path: '/announcements',
        route: announcementRoutes,
      },
      {
        path: '/configs',
        route: configRoutes,
      },
      {
        path: '/dashboard',
        route: dashboardRoutes,
      },
      {
        path: '/support-tickets',
        route: supportTicketRoutes,
      },
      // { path: '/admin', route: adminRouter },
      // { path: '/sellers', route: sellerRouter },
      // { path: '/tracking', route: trackingRoutes },
      // { path: '/announcements', route: announcementRoutes },
    ]
    this.initializeRoutes()
  }

  private initializeRoutes(): void {
    this.routes.forEach(route => {
      this.router.use(route.path, route.route)
    })
  }

  public getRouter(): Router {
    return this.router
  }
}

export default new GlobalRoutes().getRouter()

// Usage:
// const globalRoutes = new GlobalRoutes();
// app.use(globalRoutes.getRouter());
