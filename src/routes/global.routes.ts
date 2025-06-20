import { Router } from 'express'
import authRoute from '../services/Auth/auth.route'
import ftpRoutes from '../services/FtpFileUpload/ftp.routes'
import productRoutes from '../services/ProductManagement/product.routes'
import {
  categoryRouter,
  shopCategoryAssignmentRouter,
  shopRouter,
} from '../services/ProductManagement/shopCategory.routes'
import blockRoutes from '../services/UserManagement/Block Management/block.routes'
import roleRoutes from '../services/UserManagement/Role Management/role.routes'
import smsRoutes from '../services/Utility Services/Sms Service/sms.routes'
import walletRoutes from '../services/WalletManagement/wallet.routes'

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
