"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = __importDefault(require("../services/Auth/auth.route"));
const ftp_routes_1 = __importDefault(require("../services/FtpFileUpload/ftp.routes"));
const product_routes_1 = __importDefault(require("../services/ProductManagement/product.routes"));
const shopCategory_routes_1 = require("../services/ProductManagement/shopCategory.routes");
const wallet_routes_1 = __importDefault(require("../services/WalletManagement/wallet.routes"));
class GlobalRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.routes = [
            // { path: '/', route: usersRouter },
            { path: '/auth', route: auth_route_1.default },
            { path: '/wallets', route: wallet_routes_1.default },
            { path: '/shops', route: shopCategory_routes_1.shopRouter },
            { path: '/categories', route: shopCategory_routes_1.categoryRouter },
            { path: '/shop-categories', route: shopCategory_routes_1.shopCategoryAssignmentRouter },
            {
                path: '/products',
                route: product_routes_1.default,
            },
            {
                path: '/ftp',
                route: ftp_routes_1.default,
            },
            // { path: '/admin', route: adminRouter },
            // { path: '/sellers', route: sellerRouter },
            // { path: '/tracking', route: trackingRoutes },
            // { path: '/announcements', route: announcementRoutes },
        ];
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.routes.forEach(route => {
            this.router.use(route.path, route.route);
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new GlobalRoutes().getRouter();
// Usage:
// const globalRoutes = new GlobalRoutes();
// app.use(globalRoutes.getRouter());
