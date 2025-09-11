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
const order_service_1 = require("./order.service");
class OrderController {
    createSellerOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId, customerName, customerPhoneNo, customerZilla, customerUpazilla, deliveryAddress, comments, products, } = req.body;
                const order = yield order_service_1.orderService.createSellerOrder(userId, {
                    shopId: Number(shopId),
                    customerName,
                    customerPhoneNo,
                    customerZilla,
                    customerUpazilla,
                    deliveryAddress,
                    comments,
                    products,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Order created successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    createCustomerOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { shopId, customerName, customerPhoneNo, customerZilla, customerUpazilla, deliveryAddress, comments, products, } = req.body;
                const order = yield order_service_1.orderService.createCustomerOrder({
                    shopId: Number(shopId),
                    customerName,
                    customerPhoneNo,
                    customerZilla,
                    customerUpazilla,
                    deliveryAddress,
                    comments,
                    products,
                });
                res.status(201).json({
                    statusCode: 201,
                    message: 'Order created successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getSellerOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderStatus, page, limit, search } = req.query;
                const orders = yield order_service_1.orderService.getSellerOrders({
                    userId: userId,
                    orderStatus: orderStatus,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search ? String(search) : undefined,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Orders retrieved successfully',
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getCustomerOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderStatus, page, limit, search, phoneNo } = req.query;
                const orders = yield order_service_1.orderService.getCustomerOrders({
                    orderStatus: orderStatus,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search ? String(search) : undefined,
                    phoneNo: phoneNo,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Orders retrieved successfully',
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllReferredOrdersForASeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit, search, orderStatus } = req.query;
                const orders = yield order_service_1.orderService.getAllReferredOrdersForASeller({
                    userId: userId,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search ? String(search) : undefined,
                    orderStatus: orderStatus,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'All referral orders retrieved successfully',
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    orderPaymentBySeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId, paymentMethod, sellerWalletName, sellerWalletPhoneNo, systemWalletPhoneNo, amount, transactionId, } = req.body;
                const order = yield order_service_1.orderService.orderPaymentBySeller({
                    userId: userId,
                    orderId: Number(orderId),
                    paymentMethod: paymentMethod,
                    sellerWalletName,
                    sellerWalletPhoneNo,
                    systemWalletPhoneNo,
                    amount: amount ? Number(amount) : undefined,
                    transactionId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order payment processed successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    orderPaymentByCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId, customerWalletName, customerWalletPhoneNo, systemWalletPhoneNo, amount, transactionId, } = req.body;
                const order = yield order_service_1.orderService.orderPaymentByCustomer({
                    orderId: Number(orderId),
                    customerWalletName,
                    customerWalletPhoneNo,
                    systemWalletPhoneNo,
                    amount: amount,
                    transactionId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order payment processed successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    cancelOrderBySeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId, reason } = req.body;
                const order = yield order_service_1.orderService.cancelOrderBySeller({
                    userId: userId,
                    orderId: Number(orderId),
                    reason,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order cancelled successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    cancelOrderByCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId, reason, phoneNo } = req.body;
                const order = yield order_service_1.orderService.cancelOrderByCustomer({
                    phoneNo,
                    orderId: Number(orderId),
                    reason,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order cancelled successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    confirmOrderBySeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId } = req.params;
                const order = yield order_service_1.orderService.confirmOrderBySeller({
                    userId: userId,
                    orderId: Number(orderId),
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order confirmed successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    reorderFailedOrder(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId } = req.params;
                const order = yield order_service_1.orderService.reorderFailedOrder({
                    userId: userId,
                    orderId: Number(orderId),
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order reordered successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    confirmOrderByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const order = yield order_service_1.orderService.confirmOrderByAdmin({
                    orderId: Number(orderId),
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order confirmed by admin successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    deliverOrderByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { orderId } = req.params;
                const { trackingUrl } = req.body;
                const order = yield order_service_1.orderService.deliverOrderByAdmin({
                    adminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
                    orderId: Number(orderId),
                    trackingUrl,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order delivered successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    rejectOrderByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { orderId } = req.params;
                const order = yield order_service_1.orderService.rejectOrderByAdmin({
                    orderId: Number(orderId),
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order rejected successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllOrdersForAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit, search, orderStatus } = req.query;
                const orders = yield order_service_1.orderService.getOrdersForAdmin({
                    adminId: userId,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                    search: search ? String(search) : undefined,
                    orderStatus: orderStatus,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'All orders retrieved successfully',
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    cancelOrderByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId } = req.params;
                const { reason } = req.body;
                const order = yield order_service_1.orderService.cancelOrderByAdmin({
                    orderId: Number(orderId),
                    reason,
                    adminId: userId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order cancelled successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    completeOrderByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId } = req.params;
                const { amountPaidByCustomer } = req.body;
                const order = yield order_service_1.orderService.completeOrderByAdmin({
                    orderId: Number(orderId),
                    adminId: userId,
                    amountPaidByCustomer,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order completed successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    returnOrderByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId } = req.params;
                const { reason } = req.body;
                const order = yield order_service_1.orderService.returnOrderByAdmin({
                    orderId: Number(orderId),
                    adminId: userId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order returned successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    markOrderAsFailedByAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { orderId } = req.params;
                const order = yield order_service_1.orderService.markOrderAsFailed({
                    orderId: Number(orderId),
                    adminId: userId,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'Order marked as failed successfully',
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getTrendingTopSellingProducts(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const products = yield order_service_1.orderService.getTrendingTopSellingProducts(30, Boolean(user));
                res.status(200).json({
                    statusCode: 200,
                    message: 'Trending top-selling products retrieved successfully',
                    success: true,
                    data: products,
                });
            }
            catch (error) {
                throw error;
            }
        });
    }
    getAllReferredOrdersForSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit } = req.query;
                const orders = yield order_service_1.orderService.getAllReferredOrdersForSeller({
                    sellerId: userId,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'All referred orders retrieved successfully',
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getAllCustomerOrdersForSeller(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                const { page, limit } = req.query;
                const orders = yield order_service_1.orderService.getAllCustomerOrdersForSeller({
                    sellerId: userId,
                    page: Number(page) || 1,
                    limit: Number(limit) || 10,
                });
                res.status(200).json({
                    statusCode: 200,
                    message: 'All customer orders retrieved successfully',
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    checkFraud(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { phoneNumber } = req.params;
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
                const response = yield order_service_1.orderService.fraudChecker(phoneNumber);
                res.status(200).json({
                    statusCode: 200,
                    message: 'Fraud check completed successfully',
                    success: true,
                    data: response,
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new OrderController();
