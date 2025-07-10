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
const sms_services_1 = __importDefault(require("./sms.services"));
class SmsController {
    /**
     * Send generic SMS
     */
    sendSms(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipients, message } = req.body;
                const result = yield sms_services_1.default.sendSingleSms(recipients, message);
                res.status(200).json({
                    statusCode: 200,
                    message: 'SMS sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Send OTP via SMS
     */
    sendOtp(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipients, otp } = req.body;
                const result = yield sms_services_1.default.sendSingleSms(recipients, otp);
                res.status(200).json({
                    statusCode: 200,
                    message: 'OTP sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Send password via SMS
     */
    sendPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipients, password } = req.body;
                const result = yield sms_services_1.default.sendPassword(recipients, password);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Password sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Send order notification to admin(s)
     */
    sendOrderNotification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipients, orderId } = req.body;
                const result = yield sms_services_1.default.sendOrderNotificationToAdmin({
                    mobileNo: recipients,
                    orderId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order notification sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Notify admin about seller's balance withdrawal request
     */
    sendWithdrawalNotification(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipients, sellerName, sellerPhoneNo, amount } = req.body;
                const result = yield sms_services_1.default.sendWithdrawalRequestToAdmin({
                    mobileNo: recipients,
                    sellerName,
                    sellerPhoneNo,
                    amount,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Withdrawal notification sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Send order status updates
     */
    sendOrderStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipients, orderId, status, trackingUrl } = req.body;
                const result = yield sms_services_1.default.notifyCustomer({
                    customerPhoneNo: recipients,
                    orderId,
                    status,
                    trackingUrl,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order status notification sent successfully',
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new SmsController();
