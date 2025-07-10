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
const commission_services_1 = __importDefault(require("./commission.services"));
class CommissionController {
    /**
     * Replace the entire commission table with new data
     */
    replaceCommissionTable(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId; // Assuming userId is available in req.user
                const { commissions } = req.body;
                const data = yield commission_services_1.default.replaceCommissionTable(adminId, commissions);
                res.status(200).json({
                    statusCode: 200,
                    message: 'কমিশন টেবিল সফলভাবে আপডেট করা হয়েছে',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Get the current commission table
     */
    getCommissionTable(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield commission_services_1.default.getCommissionTable();
                res.status(200).json({
                    statusCode: 200,
                    message: 'কমিশন টেবিল সফলভাবে পাওয়া গেছে',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Calculate commissions for a specific price and user
     */
    calculateCommissions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userPhone, price } = req.body;
                const data = yield commission_services_1.default.calculateUserCommissions(userPhone, price);
                res.status(200).json({
                    statusCode: 200,
                    message: 'কমিশন সফলভাবে গণনা করা হয়েছে',
                    success: true,
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new CommissionController();
