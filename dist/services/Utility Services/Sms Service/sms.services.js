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
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const SmsServiceError_1 = __importDefault(require("../../../utils/SmsServiceError"));
class SmsServices {
    /**
     * Send SMS to a single recipient
     */
    static sendSingleSms(mobileNo, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    api_key: this.API_KEY,
                    type: 'text',
                    number: mobileNo,
                    senderid: this.SENDER_ID,
                    message: message,
                };
                const response = yield axios_1.default.get(this.BASE_URL, { params });
                return this.handleSmsResponse(response.data);
            }
            catch (error) {
                console.error('SMS sending failed:', error);
                throw new ApiError_1.default(500, 'Failed to send SMS');
            }
        });
    }
    /**
     * Send SMS to multiple recipients with the same message
     */
    static sendBulkSms(phoneNumbers, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (phoneNumbers.length === 0) {
                    throw new ApiError_1.default(400, 'No phone numbers provided');
                }
                //eliminate duplicates
                const uniqueNumbers = Array.from(new Set(phoneNumbers));
                // Format: "88017XXXXXXXX,88018XXXXXXXX,88019XXXXXXXX"
                const numbers = uniqueNumbers.join(',');
                const params = {
                    api_key: this.API_KEY,
                    type: 'text',
                    number: numbers,
                    senderid: this.SENDER_ID,
                    message: message,
                };
                const response = yield axios_1.default.get(this.BULK_SMS_URL, { params });
                return this.handleBulkSmsResponse(response.data);
            }
            catch (error) {
                console.error('Bulk SMS sending failed:', error);
                throw new ApiError_1.default(500, 'Failed to send bulk SMS');
            }
        });
    }
    /**
     * Send personalized SMS to multiple recipients
     */
    static sendPersonalizedBulkSms(messages) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (messages.length === 0) {
                    throw new ApiError_1.default(400, 'No messages provided');
                }
                // Format: "88017XXXXXXXX^message1~88018XXXXXXXX^message2"
                const messagesParam = messages
                    .map(m => `${m.number}^${m.message}`)
                    .join('~');
                const params = {
                    api_key: this.API_KEY,
                    type: 'text',
                    senderid: this.SENDER_ID,
                    messages: messagesParam,
                };
                const response = yield axios_1.default.get(this.BULK_SMS_URL, { params });
                return this.handleBulkSmsResponse(response.data);
            }
            catch (error) {
                console.error('Personalized bulk SMS sending failed:', error);
                throw new ApiError_1.default(500, 'Failed to send personalized bulk SMS');
            }
        });
    }
    /**
     * Handle single SMS API response
     */
    static handleSmsResponse(response) {
        const { response_code } = response;
        const message = this.responseMessages[response_code] || 'Unknown error code';
        if (response_code === 202) {
            return Object.assign(Object.assign({}, response), { success_message: response.success_message || message });
        }
        else {
            throw new SmsServiceError_1.default(400, response.error_message || message);
        }
    }
    /**
     * Handle bulk SMS API response
     */
    static handleBulkSmsResponse(response) {
        const { response_code, success_count, failed_count, failed_numbers } = response;
        if (response_code === 202) {
            return {
                response_code,
                success_count,
                failed_count,
                success_message: 'Bulk SMS submitted successfully',
                failed_numbers: failed_numbers || [],
            };
        }
        else {
            const errorMessage = this.responseMessages[response_code] || 'Unknown error occurred';
            throw new SmsServiceError_1.default(400, errorMessage);
        }
    }
    /**
     * Public method to send message(s) - automatically chooses appropriate method
     */
    static sendMessage(recipients, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(recipients)) {
                if (recipients.length === 1 && !Array.isArray(message)) {
                    return this.sendSingleSms(recipients[0], message);
                }
                if (Array.isArray(message) &&
                    message.length > 0 &&
                    typeof message[0] === 'object') {
                    // Personalized messages
                    return this.sendPersonalizedBulkSms(message);
                }
                else if (Array.isArray(message)) {
                    // Different messages for each recipient
                    if (message.length !== recipients.length) {
                        throw new ApiError_1.default(400, 'Recipients and messages count must match');
                    }
                    const messages = recipients.map((num, i) => ({
                        number: num,
                        message: message[i],
                    }));
                    return this.sendPersonalizedBulkSms(messages);
                }
                else {
                    // Same message for all recipients
                    return this.sendBulkSms(recipients, message);
                }
            }
            else {
                return this.sendSingleSms(recipients, message);
            }
        });
    }
    /**
     * Send OTP via SMS
     */
    static sendOtp(mobileNo, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = `আপনার ওটিপি কোডটি হলো: ${otp}। শপ বিডি রিসেলার জবস থেকে ধন্যবাদ।`;
            if (config_1.default.env === 'development') {
                console.log(`OTP for ${mobileNo}: ${otp}`);
                return {
                    response_code: 200,
                    success_message: 'OTP sent successfully (development mode)',
                };
            }
            return this.sendSingleSms(mobileNo, message);
        });
    }
    /**
     * Send password via SMS
     */
    static sendPassword(mobileNo, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = `আপনার পাসওয়ার্ডটি হলো: ${password}। শপ বিডি রিসেলার জবস থেকে ধন্যবাদ।`;
            if (config_1.default.env === 'development') {
                console.log(`Password for ${mobileNo}: ${password}`);
                return {
                    response_code: 200,
                    success_message: 'Password sent successfully (development mode)',
                };
            }
            return this.sendSingleSms(mobileNo, message);
        });
    }
    /**
     * Send order notification to admin(s)
     */
    static sendOrderNotificationToAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ mobileNo, orderId, }) {
            const message = `New order received (Order ID: ${orderId})`;
            if (config_1.default.enableSmsNotifications === false ||
                config_1.default.env === 'development') {
                console.log(message);
                return {
                    response_code: 200,
                    success_message: 'SMS notifications are disabled',
                };
            }
            if (Array.isArray(mobileNo)) {
                return this.sendBulkSms(mobileNo, message);
            }
            return this.sendSingleSms(mobileNo, message);
        });
    }
    /**
     * Notify admin about seller's balance withdrawal request
     */
    static sendWithdrawalRequestToAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ mobileNo, sellerName, sellerPhoneNo, amount, }) {
            const message = `Withdrawal Request: ${sellerName} (Phone: ${sellerPhoneNo}) requested ${amount} TK.`;
            if (config_1.default.enableSmsNotifications === false ||
                config_1.default.env === 'development') {
                console.log(message);
                return {
                    response_code: 200,
                    success_message: 'SMS notifications are disabled',
                };
            }
            if (Array.isArray(mobileNo)) {
                return this.sendBulkSms(mobileNo, message);
            }
            return this.sendSingleSms(mobileNo, message);
        });
    }
    /**
     * Notify seller that their order has been processed
     */
    static notifyOrderProcessed(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sellerPhoneNo, orderId, }) {
            const message = `Your order (#${orderId}) will be shipped soon.`;
            return this.sendMessage(sellerPhoneNo, message);
        });
    }
    /**
     * Notify seller that their order has been shipped with tracking URL
     */
    static notifyOrderShipped(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sellerPhoneNo, orderId, trackingUrl, }) {
            const message = `Your order (#${orderId}) has been shipped. Track it here: ${trackingUrl}`;
            if (config_1.default.env === 'development') {
                console.clear();
                console.log(message);
                return {
                    response_code: 200,
                    success_message: 'Order shipped message sent successfully (development mode)',
                };
            }
            return this.sendSingleSms(sellerPhoneNo, message);
        });
    }
    /**
     * Notify seller about order completion and commission
     */
    static notifyOrderCompleted(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sellerPhoneNo, orderId, orderAmount, commission, orderType = 'SELLER_ORDER', }) {
            let message = `Your order (#${orderId}) has been completed. Total amount: ${orderAmount} TK. Your commission: ${commission} TK.`;
            if (orderType === 'CUSTOMER_ORDER') {
                message = `Your order (#${orderId}) has been completed. Total amount: ${orderAmount} TK.`;
            }
            if (config_1.default.env === 'development') {
                console.clear();
                console.log(`Order completed message for ${sellerPhoneNo}: ${message}`);
                return {
                    response_code: 200,
                    success_message: 'Order completed message sent successfully (development mode)',
                };
            }
            return this.sendSingleSms(sellerPhoneNo, message);
        });
    }
    /**
     * Notify customer about order status
     */
    static notifyCustomer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ customerPhoneNo, orderId, status, trackingUrl = '', }) {
            let message = '';
            switch (status) {
                case 'processed':
                    message = `Your order #${orderId} has been processed.`;
                    break;
                case 'shipped':
                    message = `Your order #${orderId} has been shipped. ${trackingUrl ? `Track your order: ${trackingUrl}` : ''}`;
                    break;
                case 'delivered':
                    message = `Your order #${orderId} has been delivered.`;
                    break;
                case 'cancelled':
                    message = `Your order #${orderId} has been cancelled.`;
                    break;
            }
            return this.sendMessage(customerPhoneNo, message);
        });
    }
}
SmsServices.API_KEY = config_1.default.apiKey;
SmsServices.SENDER_ID = config_1.default.senderId;
SmsServices.BASE_URL = config_1.default.smsUrl;
SmsServices.BULK_SMS_URL = config_1.default.smsUrl; // Fallback to smsUrl if bulkSmsUrl not configured
SmsServices.responseMessages = {
    202: 'SMS Submitted Successfully',
    1001: 'Invalid Number',
    1002: 'Sender ID not correct or disabled',
    1003: 'Required fields missing or contact system administrator',
    1005: 'Internal Error',
    1006: 'Balance validity not available',
    1007: 'Insufficient balance',
    1011: 'User ID not found',
    1012: 'Masking SMS must be sent in Bengali',
    1013: 'Sender ID not found by API key',
    1014: 'Sender type name not found using this sender by API key',
    1015: 'Sender ID has no valid gateway by API key',
    1016: 'Sender type name active price info not found by this sender ID',
    1017: 'Sender type name price info not found by this sender ID',
    1018: 'Account owner is disabled',
    1019: 'Sender type name price for this account is disabled',
    1020: 'Parent account not found',
    1021: 'Parent active sender type price for this account is not found',
    1031: 'Account not verified, please contact administrator',
    1032: 'IP not whitelisted',
};
exports.default = SmsServices;
