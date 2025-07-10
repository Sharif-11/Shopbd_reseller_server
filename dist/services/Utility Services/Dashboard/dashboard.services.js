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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const order_service_1 = require("../../Order Services/order.service");
const user_services_1 = __importDefault(require("../../UserManagement/user.services"));
class Dashboard {
    getAdminDashboardData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [userData, salesData] = yield Promise.all([
                user_services_1.default.getUserStatisticsForAdmin(userId),
                order_service_1.orderService.getOrderStatisticsForAdmin({ adminId: userId }),
            ]);
            return Object.assign(Object.assign({}, userData), salesData);
        });
    }
    getResellerDashboardData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [userData, salesData] = yield Promise.all([
                user_services_1.default.getUserStatisticsForSeller(userId),
                order_service_1.orderService.getOrderStatisticsForSeller(userId),
            ]);
            return Object.assign(Object.assign({}, userData), salesData);
        });
    }
}
exports.dashboardService = new Dashboard();
