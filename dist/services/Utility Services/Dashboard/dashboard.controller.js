"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_services_1 = require("./dashboard.services");
class DashboardController {
    /**
     * Get admin dashboard statistics
     */
    getAdminDashboardData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const dashboardData = yield dashboard_services_1.dashboardService.getAdminDashboardData(adminId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Dashboard data retrieved successfully',
                    success: true,
                    data: dashboardData,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get reseller dashboard statistics
     */
    getResellerDashboardData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const resellerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const dashboardData = yield dashboard_services_1.dashboardService.getResellerDashboardData(resellerId);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Dashboard data retrieved successfully',
                    success: true,
                    data: dashboardData,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new DashboardController();
