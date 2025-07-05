"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// dashboard.route.ts
const express_1 = require("express");
const auth_middlewares_1 = require("../../../middlewares/auth.middlewares");
const dashboard_controller_1 = __importDefault(require("./dashboard.controller"));
class DashboardRouter {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // Get admin dashboard data
        this.router.get('/admin', auth_middlewares_1.isAuthenticated, dashboard_controller_1.default.getAdminDashboardData);
        this.router.get('/seller', auth_middlewares_1.isAuthenticated, dashboard_controller_1.default.getResellerDashboardData);
    }
    getRouter() {
        return this.router;
    }
}
// Export a singleton instance
exports.default = new DashboardRouter().getRouter();
