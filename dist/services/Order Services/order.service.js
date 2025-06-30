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
exports.orderService = void 0;
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const payment_service_1 = __importDefault(require("../Payment Service/payment.service"));
const product_services_1 = __importDefault(require("../ProductManagement/product.services"));
const shopCategory_services_1 = __importDefault(require("../ProductManagement/shopCategory.services"));
const block_services_1 = require("../UserManagement/Block Management/block.services");
const user_services_1 = __importDefault(require("../UserManagement/user.services"));
const commission_services_1 = __importDefault(require("../Commission Management/commission.services"));
const sms_services_1 = __importDefault(require("../Utility Services/Sms Service/sms.services"));
const transaction_services_1 = require("../Utility Services/Transaction Services/transaction.services");
const wallet_services_1 = __importDefault(require("../WalletManagement/wallet.services"));
class OrderService {
    checkExistingTrackingUrl(trackingUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingOrder = yield prisma_1.default.order.findFirst({
                where: { trackingUrl },
            });
            if (existingOrder) {
                throw new ApiError_1.default(400, 'Tracking URL already exists for another order');
            }
        });
    }
    calculateDeliveryCharge(_a) {
        return __awaiter(this, arguments, void 0, function* ({ shopId, customerZilla, productQuantity, }) {
            const shop = yield shopCategory_services_1.default.getShop(shopId);
            const basicDeliveryCharge = customerZilla.toLowerCase() === shop.shopLocation.toLowerCase()
                ? shop.deliveryChargeInside
                : shop.deliveryChargeOutside;
            if (productQuantity <= 3) {
                return basicDeliveryCharge;
            }
            else {
                const additionalCharge = (productQuantity - 3) * config_1.default.extraDeliveryCharge;
                return basicDeliveryCharge.add(additionalCharge);
            }
        });
    }
    getOrderSmsRecipients() {
        return __awaiter(this, void 0, void 0, function* () {
            const orderSmsRecipients = yield user_services_1.default.getSmsRecipientsForPermission(client_1.PermissionType.ORDER_MANAGEMENT);
            return orderSmsRecipients;
        });
    }
    createSellerOrder(userId_1, _a) {
        return __awaiter(this, arguments, void 0, function* (userId, { shopId, customerName, customerPhoneNo, customerZilla, customerUpazilla, deliveryAddress, comments, products, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const { name: sellerId, balance: sellerBalance, isVerified: sellerVerified, shopName: sellerShopName, phoneNo: sellerPhoneNo, name: sellerName, } = user;
            // check user blocked
            const isBlocked = yield block_services_1.blockServices.isUserBlocked(sellerPhoneNo, client_1.BlockActionType.ORDER_REQUEST);
            if (isBlocked) {
                throw new Error('You are blocked from placing orders');
            }
            // check shop data
            const shop = yield shopCategory_services_1.default.checkShopStatus(shopId);
            if (!shop || !shop.isActive) {
                throw new ApiError_1.default(400, 'Shop is not active');
            }
            const { shopName, shopLocation } = shop;
            // verify products
            const verifiedOrderData = yield product_services_1.default.verifyOrderProducts(products);
            console.clear();
            console.log('verifiedOrderData', verifiedOrderData);
            const deliveryCharge = yield this.calculateDeliveryCharge({
                shopId,
                customerZilla,
                productQuantity: verifiedOrderData.totalProductQuantity,
            });
            const order = yield prisma_1.default.order.create({
                data: {
                    shopId,
                    shopName,
                    shopLocation,
                    customerName,
                    customerPhoneNo,
                    customerZilla,
                    customerUpazilla,
                    customerAddress: deliveryAddress,
                    customerComments: comments,
                    OrderProduct: {
                        create: verifiedOrderData.products.map(product => ({
                            productId: product.productId,
                            productImage: product.productImage,
                            productQuantity: product.productQuantity,
                            productSellingPrice: product.productSellingPrice,
                            productVariant: product.productVariant,
                            productBasePrice: product.productBasePrice,
                            productName: product.productName,
                            totalProductBasePrice: product.totalProductBasePrice,
                            totalProductSellingPrice: product.totalProductSellingPrice,
                            totalProductQuantity: product.totalProductQuantity,
                        })),
                    },
                    deliveryCharge,
                    sellerId: userId,
                    sellerName,
                    sellerPhoneNo,
                    sellerVerified,
                    sellerShopName,
                    sellerBalance,
                    orderStatus: 'UNPAID',
                    orderType: 'SELLER_ORDER',
                    totalCommission: verifiedOrderData.totalCommission,
                    actualCommission: verifiedOrderData.totalCommission,
                    totalProductBasePrice: verifiedOrderData.totalProductBasePrice,
                    totalProductSellingPrice: verifiedOrderData.totalProductSellingPrice,
                    totalProductQuantity: verifiedOrderData.totalProductQuantity,
                },
            });
            return order;
        });
    }
    getSellerOrders(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderStatus, page, limit, search, }) {
            console.log({ orderStatus, page, limit, search });
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const where = {
                sellerId: user.userId,
                orderType: 'SELLER_ORDER',
            };
            if (orderStatus) {
                where.orderStatus = Array.isArray(orderStatus)
                    ? { in: orderStatus }
                    : orderStatus;
            }
            if (search) {
                where.OR = [
                    { customerName: { contains: search, mode: 'insensitive' } },
                    { customerPhoneNo: { contains: search, mode: 'insensitive' } },
                ];
            }
            const skip = ((page || 1) - 1) * (limit || 10);
            const orders = yield prisma_1.default.order
                .findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit || 10,
                include: {
                    OrderProduct: true,
                    Payment: true,
                },
            })
                .then(orders => orders.map(order => (Object.assign(Object.assign({}, order), { OrderProduct: order.OrderProduct.map(product => (Object.assign(Object.assign({}, product), { productVariant: JSON.parse(product.productVariant) }))) }))));
            const totalOrders = yield prisma_1.default.order.count({
                where,
            });
            return {
                orders,
                totalOrders,
                currentPage: page || 1,
                totalPages: Math.ceil(totalOrders / (limit || 10)),
                pageSize: limit || 10,
            };
        });
    }
    orderPaymentBySeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderId, paymentMethod, sellerWalletName, sellerWalletPhoneNo, systemWalletPhoneNo, amount, transactionId, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId, sellerId: userId },
                include: { OrderProduct: true },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'UNPAID') {
                throw new ApiError_1.default(400, 'Only unpaid orders can be paid');
            }
            if (order.cancelled) {
                throw new ApiError_1.default(400, 'Order already cancelled by you');
            }
            const { balance: sellerBalance, isVerified: sellerVerified } = user;
            if (paymentMethod === 'BALANCE' &&
                user.balance.toNumber() < order.deliveryCharge.toNumber()) {
                throw new ApiError_1.default(400, 'Insufficient balance in your wallet to pay for the order');
            }
            else if (paymentMethod === 'BALANCE') {
                const updatedOrder = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const updatedOrder = yield tx.order.update({
                        where: { orderId },
                        data: {
                            orderStatus: 'CONFIRMED',
                            paymentType: paymentMethod,
                            isDeliveryChargePaid: true,
                            deliveryChargePaidAt: new Date(),
                            paymentVerified: true,
                            cashOnAmount: order.totalProductSellingPrice,
                        },
                    });
                    // update seller balance
                    yield transaction_services_1.transactionServices.createTransaction({
                        tx,
                        userId,
                        transactionType: 'Debit',
                        amount: order.deliveryCharge.toNumber(),
                        reason: 'ডেলিভারি চার্জ কর্তন',
                    });
                    return updatedOrder;
                }));
                return updatedOrder;
            }
            else {
                if (!systemWalletPhoneNo ||
                    !sellerWalletName ||
                    !sellerWalletPhoneNo ||
                    !amount ||
                    !transactionId) {
                    throw new ApiError_1.default(400, 'Missing required fields');
                }
                const systemWallet = yield wallet_services_1.default.verifySystemWalletOwnership({
                    systemWalletName: sellerWalletName,
                    systemWalletPhoneNo: systemWalletPhoneNo,
                });
                if (amount < order.deliveryCharge.toNumber()) {
                    throw new ApiError_1.default(400, 'Insufficient amount to pay for the order');
                }
                const updatedOrder = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    const payment = yield payment_service_1.default.createPayment({
                        tx,
                        paymentType: 'ORDER_PAYMENT',
                        amount,
                        transactionId,
                        sender: 'SELLER',
                        userWalletName: sellerWalletName,
                        userWalletPhoneNo: sellerWalletPhoneNo,
                        systemWalletPhoneNo,
                        userName: user.name,
                        userPhoneNo: user.phoneNo,
                    });
                    const updatedOrder = yield tx.order.update({
                        where: { orderId },
                        data: {
                            orderStatus: 'PAID',
                            paymentType: paymentMethod,
                            isDeliveryChargePaid: true,
                            deliveryChargePaidAt: new Date(),
                            paymentVerified: false,
                            cashOnAmount: order.totalProductSellingPrice,
                            Payment: {
                                connect: { paymentId: payment.paymentId },
                            },
                        },
                    });
                    return updatedOrder;
                }));
                try {
                    const phoneNumbers = yield this.getOrderSmsRecipients();
                    console.clear();
                    console.log('Order SMS recipients:', phoneNumbers);
                    yield sms_services_1.default.sendOrderNotificationToAdmin({
                        mobileNo: phoneNumbers,
                        orderId: order.orderId,
                    });
                }
                catch (error) {
                    console.error('Error sending order SMS:', error);
                }
                return updatedOrder;
            }
        });
    }
    cancelOrderBySeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderId, reason, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId, sellerId: userId },
                include: { OrderProduct: true },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (!(order.orderStatus === 'UNPAID' || order.orderStatus === 'PAID')) {
                throw new ApiError_1.default(400, 'Only unpaid or paid orders can be canceled');
            }
            if (order.cancelled) {
                throw new ApiError_1.default(400, 'Order already cancelled by you');
            }
            if (order.orderStatus === 'UNPAID') {
                return yield prisma_1.default.order.update({
                    where: { orderId },
                    data: {
                        cancelled: true,
                        cancelledReason: reason,
                        cancelledBy: 'SELLER',
                        cancelledAt: new Date(),
                        orderStatus: 'CANCELLED',
                    },
                });
            }
            else {
                return yield prisma_1.default.order.update({
                    where: { orderId },
                    data: {
                        cancelled: true,
                        cancelledReason: reason,
                        cancelledBy: 'SELLER',
                        cancelledAt: new Date(),
                    },
                });
            }
        });
    }
    confirmOrderBySeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderId, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId, sellerId: userId },
                include: { OrderProduct: true },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.cancelled) {
                throw new ApiError_1.default(400, 'Order already cancelled by you');
            }
            if (order.orderStatus === 'PAID') {
                throw new ApiError_1.default(400, 'Order already paid');
            }
            if (order.orderStatus === 'UNPAID' && !order.sellerVerified) {
                throw new ApiError_1.default(400, 'Only unpaid orders can be confirmed by verified sellers');
            }
            if (order.orderStatus !== 'UNPAID') {
                throw new ApiError_1.default(400, 'Only unpaid orders can be confirmed');
            }
            const result = yield prisma_1.default.order.update({
                where: { orderId },
                data: {
                    orderStatus: 'CONFIRMED',
                    cashOnAmount: order.totalProductSellingPrice.add(order.deliveryCharge.toNumber()),
                },
            });
            if (result) {
                try {
                    const phoneNumbers = yield this.getOrderSmsRecipients();
                    console.clear();
                    console.log('Order SMS recipients:', phoneNumbers);
                    yield sms_services_1.default.sendOrderNotificationToAdmin({
                        mobileNo: phoneNumbers,
                        orderId: order.orderId,
                    });
                }
                catch (error) {
                    console.error('Error sending order SMS:', error);
                }
            }
            return result;
        });
    }
    confirmOrderByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ tx, orderId, }) {
            const order = yield (tx || prisma_1.default).order.findUnique({
                where: { orderId },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'PAID') {
                throw new ApiError_1.default(400, 'Only paid orders can be confirmed');
            }
            const result = yield (tx || prisma_1.default).order.update({
                where: { orderId },
                data: {
                    orderStatus: 'CONFIRMED',
                },
            });
            return result;
        });
    }
    deliverOrderByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, orderId, trackingUrl, }) {
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
                include: { OrderProduct: true },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            yield this.checkExistingTrackingUrl(trackingUrl);
            if (order.orderStatus !== 'CONFIRMED') {
                throw new ApiError_1.default(400, 'Only confirmed orders can be delivered');
            }
            // await SmsServices.notifyOrderShipped({
            //   sellerPhoneNo: order.sellerPhoneNo!,
            //   orderId: order.orderId,
            //   trackingUrl: trackingUrl || '',
            // })
            const result = yield prisma_1.default.order.update({
                where: { orderId },
                data: {
                    orderStatus: 'DELIVERED',
                    trackingUrl,
                },
            });
            if (result) {
                try {
                    yield sms_services_1.default.notifyOrderShipped({
                        sellerPhoneNo: order.sellerPhoneNo,
                        orderId: order.orderId,
                        trackingUrl: trackingUrl || '',
                    });
                }
                catch (error) {
                    console.error('Error sending order SMS:', error);
                }
            }
        });
    }
    reorderFailedOrder(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderId, }) {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'FAILED') {
                throw new ApiError_1.default(400, 'Only failed orders can be reordered');
            }
            const updatedOrder = yield prisma_1.default.order.update({
                where: { orderId },
                data: {
                    orderStatus: 'CONFIRMED',
                    trackingUrl: null,
                },
            });
            return updatedOrder;
        });
    }
    rejectOrderByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ tx, orderId, }) {
            const order = yield (tx || prisma_1.default).order.findUnique({
                where: { orderId },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus === 'CANCELLED') {
                return yield (tx || prisma_1.default).order.update({
                    where: { orderId },
                    data: {
                        orderStatus: 'CANCELLED',
                    },
                });
            }
            return yield (tx || prisma_1.default).order.update({
                where: { orderId },
                data: {
                    orderStatus: 'REJECTED',
                },
            });
        });
    }
    getOrdersForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, orderStatus, page, limit, search, }) {
            // check admin permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.READ);
            const where = {};
            if (orderStatus) {
                where.orderStatus = Array.isArray(orderStatus)
                    ? { in: orderStatus }
                    : orderStatus;
            }
            if (search) {
                where.OR = [
                    { customerName: { contains: search, mode: 'insensitive' } },
                    { customerPhoneNo: { contains: search, mode: 'insensitive' } },
                    {
                        sellerPhoneNo: { contains: search, mode: 'insensitive' },
                    },
                    {
                        sellerName: { contains: search, mode: 'insensitive' },
                    },
                ];
            }
            const skip = ((page || 1) - 1) * (limit || 10);
            const orders = yield prisma_1.default.order
                .findMany({
                where,
                skip,
                take: limit || 10,
                include: {
                    OrderProduct: true,
                    Payment: true,
                },
            })
                .then(orders => orders.map(order => (Object.assign(Object.assign({}, order), { OrderProduct: order.OrderProduct.map(product => (Object.assign(Object.assign({}, product), { productVariant: JSON.parse(product.productVariant) }))) }))));
            const totalOrders = yield prisma_1.default.order.count({
                where,
            });
            return {
                orders,
                totalOrders,
                currentPage: page || 1,
                totalPages: Math.ceil(totalOrders / (limit || 10)),
                pageSize: limit || 10,
            };
        });
    }
    cancelOrderByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, orderId, reason, }) {
            var _b;
            // check admin permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
                include: {
                    Payment: true,
                },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'CONFIRMED') {
                throw new ApiError_1.default(400, 'Only confirmed orders can be cancelled by admin');
            }
            if (((_b = order.Payment) === null || _b === void 0 ? void 0 : _b.paymentStatus) === 'COMPLETED' ||
                order.paymentType === 'BALANCE') {
                // we need to refund the payment to the seller and update the order status as refunded within the transaction
                const result = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    yield transaction_services_1.transactionServices.createTransaction({
                        tx,
                        userId: order.sellerId,
                        transactionType: 'Credit',
                        amount: order.deliveryCharge.toNumber(),
                        reason: 'অর্ডার বাতিলের জন্য রিফান্ড',
                    });
                    yield tx.order.update({
                        where: { orderId },
                        data: {
                            orderStatus: 'REFUNDED',
                            cancelledReason: reason,
                            cancelledBy: 'SYSTEM',
                            cancelledAt: new Date(),
                        },
                    });
                    return order;
                }));
                return result;
            }
            return yield prisma_1.default.order.update({
                where: { orderId },
                data: {
                    orderStatus: 'CANCELLED',
                    cancelledReason: reason,
                    cancelledBy: 'SYSTEM',
                    cancelledAt: new Date(),
                },
            });
        });
    }
    completeOrderByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, orderId, amountPaidByCustomer, }) {
            // check admin permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
                include: {
                    Payment: true,
                },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'DELIVERED') {
                throw new ApiError_1.default(400, 'Only delivered orders can be completed by admin');
            }
            if (!order.cashOnAmount) {
                throw new ApiError_1.default(400, 'Cash on amount is not set for this order');
            }
            const minimumAmountToBePaid = order.totalProductBasePrice
                .add(order.cashOnAmount)
                .sub(order.totalProductSellingPrice);
            if (amountPaidByCustomer < minimumAmountToBePaid.toNumber()) {
                throw new ApiError_1.default(400, `ন্যূনতম পরিশোধ : ${minimumAmountToBePaid.toFixed(2)} টাকা`);
            }
            const actualCommission = amountPaidByCustomer - minimumAmountToBePaid.toNumber();
            const result = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Update order status to COMPLETED
                const updatedOrder = yield tx.order.update({
                    where: { orderId },
                    data: {
                        orderStatus: 'COMPLETED',
                        actualCommission,
                        amountPaidByCustomer,
                    },
                });
                // count how many orders the seller has completed
                const completedOrdersCount = yield tx.order.count({
                    where: {
                        sellerId: updatedOrder.sellerId,
                        orderStatus: 'COMPLETED',
                    },
                });
                if (completedOrdersCount >= config_1.default.minimumOrderCompletedToBeVerified) {
                    yield user_services_1.default.verifySeller({ tx, userId: updatedOrder.sellerId });
                }
                // add seller commission to seller wallet
                yield transaction_services_1.transactionServices.createTransaction({
                    tx,
                    userId: updatedOrder.sellerId,
                    transactionType: 'Credit',
                    amount: actualCommission,
                    reason: 'অর্ডার সম্পন্নের কমিশন',
                });
                return updatedOrder;
            }));
            if (result.orderStatus === 'COMPLETED') {
                try {
                    const referrers = yield commission_services_1.default.calculateUserCommissions(order.sellerPhoneNo, order.totalProductSellingPrice.toNumber());
                    if (referrers.length > 0) {
                        const sendCommissions = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                            const commissionPromises = referrers.map(referrer => {
                                return transaction_services_1.transactionServices.createTransaction({
                                    tx,
                                    userId: referrer.userId,
                                    amount: referrer.commissionAmount,
                                    reason: `রেফারেল কমিশন`,
                                    transactionType: 'Credit',
                                    reference: {
                                        seller: result.sellerName,
                                        level: referrer.level,
                                        orderId: result.orderId,
                                    },
                                });
                            });
                            return yield Promise.all(commissionPromises);
                        }));
                    }
                }
                catch (error) {
                    console.log('Failed to send commissions:', error);
                }
            }
            try {
                yield sms_services_1.default.notifyOrderCompleted({
                    sellerPhoneNo: order.sellerPhoneNo,
                    orderId: order.orderId,
                    commission: result.actualCommission.toNumber() || 0,
                    orderAmount: result.totalProductSellingPrice.toNumber(),
                });
            }
            catch (error) {
                console.error('Error sending order SMS:', error);
            }
            return result;
        });
    }
    returnOrderByAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, orderId, }) {
            // check admin permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
                include: {
                    Payment: true,
                },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'DELIVERED') {
                throw new ApiError_1.default(400, 'Only delivered orders can be returned');
            }
            if (!order.Payment && order.paymentType !== 'BALANCE') {
                // we need to deduct the delivery charge from the seller's balance and update the order status as returned within the transaction
                const result = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    yield transaction_services_1.transactionServices.createTransaction({
                        tx,
                        userId: order.sellerId,
                        transactionType: 'Debit',
                        amount: order.deliveryCharge.toNumber(),
                        reason: 'অর্ডার ফেরত দেওয়ার জন্য ডেলিভারি চার্জ কর্তন',
                    });
                    yield tx.order.update({
                        where: { orderId },
                        data: {
                            orderStatus: 'RETURNED',
                        },
                    });
                    return order;
                }));
                return result;
            }
            else {
                // just update the order status to returned
                return yield prisma_1.default.order.update({
                    where: { orderId },
                    data: {
                        orderStatus: 'RETURNED',
                    },
                });
            }
        });
    }
    markOrderAsFailed(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId, orderId, }) {
            // check admin permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.ORDER_MANAGEMENT, client_1.ActionType.UPDATE);
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
            });
            if (!order) {
                throw new ApiError_1.default(404, 'Order not found');
            }
            if (order.orderStatus !== 'DELIVERED') {
                throw new ApiError_1.default(400, 'Only delivered orders can be marked as failed');
            }
            return yield prisma_1.default.order.update({
                where: { orderId },
                data: {
                    orderStatus: 'FAILED',
                },
            });
        });
    }
}
exports.orderService = new OrderService();
