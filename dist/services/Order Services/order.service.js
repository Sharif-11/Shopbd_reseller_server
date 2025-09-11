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
const axios_1 = __importDefault(require("axios"));
const commission_services_1 = __importDefault(require("../Commission Management/commission.services"));
const sms_services_1 = __importDefault(require("../Utility Services/Sms Service/sms.services"));
const transaction_services_1 = require("../Utility Services/Transaction Services/transaction.services");
const wallet_services_1 = __importDefault(require("../WalletManagement/wallet.services"));
class OrderService {
    constructor() {
        this.fraudCheckCache = new Map();
    }
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
            const deliveryCharge = yield this.calculateDeliveryCharge({
                shopId,
                customerZilla,
                productQuantity: verifiedOrderData.totalProductQuantity,
            });
            // check if there is an unpaid order for the seller
            const existingOrder = yield prisma_1.default.order.findFirst({
                where: {
                    sellerId,
                    orderStatus: 'UNPAID',
                    orderType: 'SELLER_ORDER',
                },
            });
            if (existingOrder) {
                throw new ApiError_1.default(400, 'আপনার একটি পেমেন্ট করা হয়নি এমন অর্ডার রয়েছে। নতুন অর্ডার করার আগে অনুগ্রহ করে সেটি পেমেন্ট করুন অথবা কনফার্ম করুন।');
            }
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
    createCustomerOrder(_a) {
        return __awaiter(this, arguments, void 0, function* ({ shopId, customerName, customerPhoneNo, customerZilla, customerUpazilla, deliveryAddress, comments, products, }) {
            // find customer by phone number
            const customer = yield user_services_1.default.getCustomerByPhoneNo({
                customerPhoneNo,
            });
            const isBlocked = yield block_services_1.blockServices.isUserBlocked(customerPhoneNo, client_1.BlockActionType.ORDER_REQUEST);
            if (isBlocked) {
                throw new Error('You are blocked from placing orders. Please contact support.');
            }
            const shop = yield shopCategory_services_1.default.checkShopStatus(shopId);
            if (!shop || !shop.isActive) {
                throw new ApiError_1.default(400, 'Shop is not active');
            }
            const { shopName, shopLocation } = shop;
            const verifiedOrderData = yield product_services_1.default.verifyOrderProducts(products);
            const deliveryCharge = yield this.calculateDeliveryCharge({
                shopId,
                customerZilla,
                productQuantity: verifiedOrderData.totalProductQuantity,
            });
            // check if there is an unpaid order for the customer
            const existingOrder = yield prisma_1.default.order.findFirst({
                where: {
                    customerPhoneNo,
                    orderStatus: 'UNPAID',
                    orderType: 'CUSTOMER_ORDER',
                },
            });
            if (existingOrder) {
                throw new ApiError_1.default(400, 'আপনার একটি পেমেন্ট করা হয়নি এমন অর্ডার রয়েছে। নতুন অর্ডার করার আগে অনুগ্রহ করে সেটি পেমেন্ট করুন।');
            }
            // now check if customer has enough balance to pay delivery charge
            if ((customer === null || customer === void 0 ? void 0 : customer.balance) < deliveryCharge) {
                const order = yield prisma_1.default.order.create({
                    data: {
                        shopId,
                        customerName,
                        customerPhoneNo,
                        customerZilla,
                        customerUpazilla,
                        customerAddress: deliveryAddress,
                        customerComments: comments,
                        shopName,
                        shopLocation,
                        isDeliveryChargePaid: false,
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
                        sellerId: (customer === null || customer === void 0 ? void 0 : customer.sellerId) || '',
                        sellerName: (customer === null || customer === void 0 ? void 0 : customer.sellerName) || '',
                        sellerPhoneNo: (customer === null || customer === void 0 ? void 0 : customer.sellerPhone) || '',
                        orderStatus: 'UNPAID',
                        orderType: 'CUSTOMER_ORDER',
                        totalCommission: verifiedOrderData.totalCommission,
                        actualCommission: verifiedOrderData.totalCommission,
                        totalProductBasePrice: verifiedOrderData.totalProductBasePrice,
                        totalProductSellingPrice: verifiedOrderData.totalProductSellingPrice,
                        totalProductQuantity: verifiedOrderData.totalProductQuantity,
                    },
                });
                // update customer name if different
                if ((customer === null || customer === void 0 ? void 0 : customer.customerName) !== customerName) {
                    yield user_services_1.default.updateCustomerProfile({
                        customerId: customer === null || customer === void 0 ? void 0 : customer.customerId,
                        customerName,
                    });
                }
                // send order notification to admin
                return order;
            }
            else {
                // we need to deduct balance from customer and create a order with status paid within a transaction
                const order = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    yield transaction_services_1.transactionServices.createTransactionForCustomer({
                        tx,
                        customerId: customer === null || customer === void 0 ? void 0 : customer.customerId,
                        amount: deliveryCharge.toNumber(),
                        transactionType: 'Debit',
                        reason: 'অর্ডারের জন্য ডেলিভারি চার্জ কর্তন (গ্রাহক)',
                    });
                    const order = yield tx.order.create({
                        data: {
                            shopId,
                            customerName,
                            customerPhoneNo,
                            customerZilla,
                            customerUpazilla,
                            customerAddress: deliveryAddress,
                            customerComments: comments,
                            shopName,
                            shopLocation,
                            isDeliveryChargePaid: true,
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
                            sellerId: (customer === null || customer === void 0 ? void 0 : customer.sellerId) || '',
                            sellerName: (customer === null || customer === void 0 ? void 0 : customer.sellerName) || '',
                            sellerPhoneNo: (customer === null || customer === void 0 ? void 0 : customer.sellerPhone) || '',
                            orderStatus: 'PAID',
                            orderType: 'CUSTOMER_ORDER',
                            totalCommission: verifiedOrderData.totalCommission.toNumber() *
                                config_1.default.sellerCommissionRate,
                            actualCommission: verifiedOrderData.totalCommission.toNumber() *
                                config_1.default.sellerCommissionRate,
                            totalProductBasePrice: verifiedOrderData.totalProductBasePrice,
                            totalProductSellingPrice: verifiedOrderData.totalProductSellingPrice,
                            totalProductQuantity: verifiedOrderData.totalProductQuantity,
                        },
                    });
                    // send order notification to admin
                    return order;
                }));
                // update customer name if different
                if ((customer === null || customer === void 0 ? void 0 : customer.customerName) !== customerName) {
                    yield user_services_1.default.updateCustomerProfile({
                        customerId: customer === null || customer === void 0 ? void 0 : customer.customerId,
                        customerName,
                    });
                }
                return order;
            }
            // now create order connecting with payment
        });
    }
    getSellerOrders(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderStatus, page, limit, search, }) {
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
    getCustomerOrders(_a) {
        return __awaiter(this, arguments, void 0, function* ({ phoneNo, orderStatus, page, limit, search, }) {
            const customer = yield user_services_1.default.getCustomerByPhoneNo({
                customerPhoneNo: phoneNo,
            });
            const where = {
                customerPhoneNo: phoneNo,
                orderType: 'CUSTOMER_ORDER',
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
    getAllReferredOrdersForASeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userId, orderStatus, page = 1, limit = 10, search, }) {
            try {
                const user = yield user_services_1.default.getUserById(userId);
                if (!user) {
                    throw new ApiError_1.default(404, 'User not found');
                }
                const referrals = user.referrals.map(referral => referral.phoneNo);
                const validatedPage = Math.max(1, page);
                const validatedLimit = Math.min(Math.max(1, limit), 100);
                let where = {
                    OR: [
                        { sellerPhoneNo: { in: referrals } },
                        {
                            sellerId: user.userId,
                            orderType: 'CUSTOMER_ORDER',
                        },
                    ],
                };
                if (orderStatus) {
                    where.orderStatus = Array.isArray(orderStatus)
                        ? { in: orderStatus }
                        : orderStatus;
                }
                if (search) {
                    where = {
                        AND: [
                            where,
                            {
                                OR: [
                                    { customerName: { contains: search, mode: 'insensitive' } },
                                    { customerPhoneNo: { contains: search, mode: 'insensitive' } },
                                ],
                            },
                        ],
                    };
                }
                const skip = (validatedPage - 1) * validatedLimit;
                const [orders, totalOrders] = yield Promise.all([
                    prisma_1.default.order.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: validatedLimit,
                        include: {
                            OrderProduct: {
                                include: {
                                // Include related data if needed
                                },
                            },
                            Payment: true,
                        },
                    }),
                    prisma_1.default.order.count({ where }),
                ]);
                const processedOrders = orders.map(order => (Object.assign(Object.assign({}, order), { OrderProduct: order.OrderProduct.map(product => (Object.assign(Object.assign({}, product), { productVariant: JSON.parse(product.productVariant) }))) })));
                return {
                    orders: processedOrders,
                    totalOrders,
                    currentPage: validatedPage,
                    totalPages: Math.ceil(totalOrders / validatedLimit) || 1,
                    pageSize: validatedLimit,
                };
            }
            catch (error) {
                if (error instanceof ApiError_1.default) {
                    throw error;
                }
                throw new ApiError_1.default(500, 'Failed to fetch orders');
            }
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
                    try {
                        const phoneNumbers = yield this.getOrderSmsRecipients();
                        console.clear();
                        console.log(phoneNumbers);
                        yield sms_services_1.default.sendOrderNotificationToAdmin({
                            mobileNo: phoneNumbers,
                            orderId: order.orderId,
                        });
                    }
                    catch (error) {
                        console.error('Error sending order SMS:', error);
                    }
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
    orderPaymentByCustomer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ orderId, customerWalletName, customerWalletPhoneNo, systemWalletPhoneNo, amount, transactionId, }) {
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId },
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
            if (!systemWalletPhoneNo ||
                !customerWalletName ||
                !customerWalletPhoneNo ||
                !amount ||
                !transactionId) {
                throw new ApiError_1.default(400, 'Missing required fields');
            }
            const systemWallet = yield wallet_services_1.default.verifySystemWalletOwnership({
                systemWalletName: customerWalletName,
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
                    sender: 'CUSTOMER',
                    userWalletName: customerWalletName,
                    userWalletPhoneNo: customerWalletPhoneNo,
                    systemWalletPhoneNo,
                    userName: order.customerName,
                    userPhoneNo: order.customerPhoneNo,
                });
                const updatedOrder = yield tx.order.update({
                    where: { orderId },
                    data: {
                        orderStatus: 'PAID',
                        paymentType: 'WALLET',
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
                yield sms_services_1.default.sendOrderNotificationToAdmin({
                    mobileNo: phoneNumbers,
                    orderId: order.orderId,
                });
            }
            catch (error) {
                console.error('Error sending order SMS:', error);
            }
            return updatedOrder;
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
    cancelOrderByCustomer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ phoneNo, orderId, reason, }) {
            const customer = yield user_services_1.default.getCustomerByPhoneNo({
                customerPhoneNo: phoneNo,
            });
            const order = yield prisma_1.default.order.findUnique({
                where: { orderId, sellerId: customer === null || customer === void 0 ? void 0 : customer.sellerId },
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
                        cancelledBy: 'CUSTOMER',
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
                        cancelledBy: 'CUSTOMER',
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
            // await this.checkExistingTrackingUrl(trackingUrl?.trim())
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
                    trackingUrl: (trackingUrl === null || trackingUrl === void 0 ? void 0 : trackingUrl.trim()) || null,
                },
            });
            if (result) {
                try {
                    yield sms_services_1.default.notifyOrderShipped({
                        sellerPhoneNo: result.orderType === 'SELLER_ORDER'
                            ? order.sellerPhoneNo
                            : order.customerPhoneNo,
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
            var _b, _c;
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
            if (order.orderType === 'SELLER_ORDER') {
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
            }
            else {
                const customer = yield user_services_1.default.getCustomerByPhoneNo({
                    customerPhoneNo: order.customerPhoneNo,
                });
                if (!customer) {
                    throw new ApiError_1.default(404, 'Customer not found');
                }
                // handle customer order cancellation
                if (((_c = order === null || order === void 0 ? void 0 : order.Payment) === null || _c === void 0 ? void 0 : _c.paymentStatus) === 'COMPLETED') {
                    const result = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                        yield transaction_services_1.transactionServices.createTransactionForCustomer({
                            tx,
                            customerId: customer.customerId,
                            amount: order.deliveryCharge.toNumber(),
                            reason: 'অর্ডার বাতিলের জন্য রিফান্ড',
                            transactionType: 'Credit',
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
                else {
                    const updatedOrder = yield prisma_1.default.order.update({
                        where: { orderId },
                        data: {
                            orderStatus: 'CANCELLED',
                            cancelledReason: reason,
                            cancelledBy: 'SYSTEM',
                            cancelledAt: new Date(),
                        },
                    });
                    return updatedOrder;
                }
            }
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
                actualCommission > 0 &&
                    (yield transaction_services_1.transactionServices.createTransaction({
                        tx,
                        userId: updatedOrder.sellerId,
                        transactionType: 'Credit',
                        amount: order.orderType === 'SELLER_ORDER'
                            ? actualCommission
                            : config_1.default.sellerCommissionRate * actualCommission,
                        reason: 'অর্ডার সম্পন্নের কমিশন',
                        reference: order.orderType === 'CUSTOMER_ORDER'
                            ? {
                                customerName: updatedOrder.customerName,
                                customerPhoneNo: updatedOrder.customerPhoneNo,
                                orderId: updatedOrder.orderId,
                            }
                            : undefined,
                    }));
                return updatedOrder;
            }));
            if (result.orderStatus === 'COMPLETED' &&
                result.orderType === 'SELLER_ORDER') {
                try {
                    const referrers = yield commission_services_1.default.calculateUserCommissions(order.sellerPhoneNo, order.totalProductBasePrice.toNumber());
                    if (referrers.length > 0) {
                        yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
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
                        }), {
                            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
                            timeout: referrers.length * 2000 + 5000,
                        });
                    }
                }
                catch (error) {
                    console.log('Failed to send commissions:', error);
                }
            }
            try {
                yield sms_services_1.default.notifyOrderCompleted({
                    sellerPhoneNo: order.orderType === 'SELLER_ORDER'
                        ? order.sellerPhoneNo
                        : order.customerPhoneNo,
                    orderId: order.orderId,
                    commission: result.actualCommission.toNumber() || 0,
                    orderAmount: result.totalProductSellingPrice.toNumber(),
                    orderType: result.orderType,
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
    getOrderStatisticsForAdmin(_a) {
        return __awaiter(this, arguments, void 0, function* ({ adminId }) {
            var _b, _c, _d, _e;
            // Check admin permission
            yield user_services_1.default.verifyUserPermission(adminId, client_1.PermissionType.DASHBOARD_ANALYTICS, client_1.ActionType.READ);
            // Calculate date boundaries once
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            // Fetch all necessary data in parallel
            const [allOrders, allOrderProducts] = yield Promise.all([
                prisma_1.default.order.findMany({
                    include: {
                        OrderProduct: true,
                    },
                }),
                prisma_1.default.orderProduct.findMany({
                    include: {
                        order: true,
                    },
                }),
            ]);
            // Initialize counters
            let totalSales = 0;
            let totalCommission = 0;
            let completedOrdersCount = 0;
            let last30DaysCompleted = 0;
            let last7DaysCompleted = 0;
            let totalProductsSold = 0;
            let last7daysTotalSales = 0;
            let last30daysTotalSales = 0;
            // Process orders
            for (const order of allOrders) {
                if (order.orderStatus === 'COMPLETED') {
                    totalSales += ((_b = order.amountPaidByCustomer) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0;
                    totalCommission += ((_c = order.actualCommission) === null || _c === void 0 ? void 0 : _c.toNumber()) || 0;
                    completedOrdersCount++;
                    // Check recent completed orders
                    if (order.createdAt >= thirtyDaysAgo) {
                        last30DaysCompleted++;
                        last30daysTotalSales += ((_d = order.amountPaidByCustomer) === null || _d === void 0 ? void 0 : _d.toNumber()) || 0;
                    }
                    if (order.createdAt >= sevenDaysAgo) {
                        last7DaysCompleted++;
                        last7daysTotalSales += ((_e = order.amountPaidByCustomer) === null || _e === void 0 ? void 0 : _e.toNumber()) || 0;
                    }
                }
            }
            // Process order products
            for (const orderProduct of allOrderProducts) {
                if (orderProduct.order.orderStatus === 'COMPLETED') {
                    totalProductsSold += orderProduct.productQuantity || 0;
                }
            }
            return {
                totalOrders: allOrders.length,
                totalSales,
                totalCommission,
                totalProductsSold,
                totalOrdersCompleted: completedOrdersCount,
                totalOrdersCompletedLast30Days: last30DaysCompleted,
                totalOrdersCompletedLast7Days: last7DaysCompleted,
                totalSalesLast30Days: last30daysTotalSales,
                totalSalesLast7Days: last7daysTotalSales,
            };
        });
    }
    getOrderStatisticsForSeller(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_services_1.default.getUserById(userId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            // Calculate date ranges
            const now = new Date();
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(now);
            todayEnd.setHours(23, 59, 59, 999);
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(todayEnd);
            yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // Get all orders for the seller
            const orders = yield prisma_1.default.order.findMany({
                where: { sellerId: userId },
                include: {
                    OrderProduct: true,
                },
            });
            // Filter orders for different time periods
            const todayOrders = orders.filter(order => new Date(order.createdAt) >= todayStart &&
                new Date(order.createdAt) <= todayEnd);
            const yesterdayOrders = orders.filter(order => new Date(order.createdAt) >= yesterdayStart &&
                new Date(order.createdAt) <= yesterdayEnd);
            const last7DaysOrders = orders.filter(order => new Date(order.createdAt) >= sevenDaysAgo);
            const last30DaysOrders = orders.filter(order => new Date(order.createdAt) >= thirtyDaysAgo);
            // Function to calculate statistics for a given order set
            const calculateStats = (orderSet) => {
                var _a, _b;
                let totalSales = 0;
                let totalIncome = 0; // Using actualCommission as income
                let completedOrdersCount = 0;
                let totalProductsSold = 0;
                for (const order of orderSet) {
                    if (order.orderStatus === 'COMPLETED') {
                        totalSales += ((_a = order.totalProductSellingPrice) === null || _a === void 0 ? void 0 : _a.toNumber()) || 0;
                        totalIncome += ((_b = order.actualCommission) === null || _b === void 0 ? void 0 : _b.toNumber()) || 0;
                        completedOrdersCount++;
                    }
                    for (const product of order.OrderProduct) {
                        if (order.orderStatus === 'COMPLETED') {
                            totalProductsSold += product.productQuantity || 0;
                        }
                    }
                }
                return {
                    totalOrders: orderSet.length,
                    totalSales,
                    totalIncome, // Changed from totalCommission to totalIncome
                    totalProductsSold,
                    totalOrdersCompleted: completedOrdersCount,
                };
            };
            // Calculate statistics for all time periods
            const allTimeStats = calculateStats(orders);
            const last30DaysStats = calculateStats(last30DaysOrders);
            const last7DaysStats = calculateStats(last7DaysOrders);
            const todayStats = calculateStats(todayOrders);
            const yesterdayStats = calculateStats(yesterdayOrders);
            return {
                allTime: allTimeStats,
                last30Days: last30DaysStats,
                last7Days: last7DaysStats,
                today: todayStats,
                yesterday: yesterdayStats,
            };
        });
    }
    getTrendingTopSellingProducts() {
        return __awaiter(this, arguments, void 0, function* (daysBack = 30, isSeller = false, page = 1, limit = 10) {
            const now = new Date();
            const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
            const trendingProducts = yield prisma_1.default.orderProduct.groupBy({
                by: ['productId', 'productName'],
                _sum: {
                    productQuantity: true,
                },
                where: {
                    order: {
                        createdAt: {
                            gte: pastDate,
                        },
                        orderStatus: 'COMPLETED',
                    },
                },
                orderBy: {
                    _sum: {
                        productQuantity: 'desc',
                    },
                },
                take: limit,
                skip: (page - 1) * limit,
            });
            const trendingProductCount = yield prisma_1.default.orderProduct.groupBy({
                by: ['productId', 'productName'],
                _sum: {
                    productQuantity: true,
                },
                where: {
                    order: {
                        createdAt: {
                            gte: pastDate,
                        },
                        orderStatus: 'COMPLETED',
                    },
                },
                orderBy: {
                    _sum: {
                        productQuantity: 'desc',
                    },
                },
                take: 30,
            });
            // fetch product details for each trending product
            let data = [];
            if (trendingProducts.length === 0) {
                return [];
            }
            const productIds = trendingProducts.map(product => product.productId);
            const products = yield prisma_1.default.product.findMany({
                where: {
                    productId: { in: productIds },
                },
                select: {
                    productId: true,
                    name: true,
                    basePrice: true,
                    suggestedMaxPrice: true,
                    // custom property price
                    shop: { select: { shopName: true, shopLocation: true } },
                    // only select the first image for simplicity
                    ProductImage: {
                        where: { hidden: false },
                        select: { imageUrl: true },
                        orderBy: { isPrimary: 'desc' },
                    },
                },
            });
            // Combine product details with sales data
            data = trendingProducts.map(product => {
                const productDetails = products.find(p => p.productId === product.productId);
                return Object.assign(Object.assign({}, productDetails), { price: isSeller
                        ? productDetails.basePrice
                        : productDetails.suggestedMaxPrice, totalSold: product._sum.productQuantity || 0 });
            });
            return {
                data,
                total: trendingProductCount.length,
                page,
                limit,
                totalPages: Math.ceil(trendingProductCount.length / limit),
            };
        });
    }
    getAllReferredOrdersForSeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sellerId, page = 1, limit = 10, }) {
            try {
                const user = yield user_services_1.default.getUserById(sellerId);
                if (!user) {
                    throw new ApiError_1.default(404, 'User not found');
                }
                // Get all referred seller phone numbers up to level 2 with their levels
                const referredSellerPhones = yield user_services_1.default.getReferredSellerPhonesByLevel({
                    sellerPhoneNo: user.phoneNo,
                    level: 2,
                });
                const referredPhoneNumbers = referredSellerPhones.map(ref => ref.phoneNo);
                const validatedPage = Math.max(1, page);
                const validatedLimit = Math.min(Math.max(1, limit), 100);
                const where = {
                    sellerPhoneNo: { in: referredPhoneNumbers },
                    orderType: 'SELLER_ORDER', // Exclude CUSTOMER_ORDER
                };
                const skip = (validatedPage - 1) * validatedLimit;
                const [orders, totalOrders] = yield Promise.all([
                    prisma_1.default.order.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        skip,
                        take: validatedLimit,
                        select: {
                            orderId: true,
                            sellerName: true,
                            sellerPhoneNo: true,
                            actualCommission: true,
                            createdAt: true,
                            orderStatus: true,
                            OrderProduct: {
                                select: {
                                    productName: true,
                                    productImage: true,
                                    productQuantity: true,
                                },
                            },
                        },
                    }),
                    prisma_1.default.order.count({ where }),
                ]);
                // Add level information to each order
                const processedOrders = orders.map(order => {
                    var _a;
                    const sellerLevel = ((_a = referredSellerPhones.find(ref => ref.phoneNo === order.sellerPhoneNo)) === null || _a === void 0 ? void 0 : _a.level) || 0;
                    return {
                        orderId: order.orderId,
                        sellerName: order.sellerName,
                        sellerPhoneNo: order.sellerPhoneNo,
                        sellerLevel: sellerLevel,
                        orderStatus: order.orderStatus,
                        commission: order.actualCommission,
                        createdAt: order.createdAt,
                        products: order.OrderProduct.map(product => ({
                            name: product.productName,
                            image: product.productImage,
                            quantity: product.productQuantity,
                        })),
                    };
                });
                return {
                    orders: processedOrders,
                    totalOrders,
                    currentPage: validatedPage,
                    totalPages: Math.ceil(totalOrders / validatedLimit) || 1,
                    pageSize: validatedLimit,
                };
            }
            catch (error) {
                if (error instanceof ApiError_1.default) {
                    throw error;
                }
                throw new ApiError_1.default(500, 'Failed to fetch referral orders');
            }
        });
    }
    getAllCustomerOrdersForSeller(_a) {
        return __awaiter(this, arguments, void 0, function* ({ sellerId, page = 1, limit = 10, }) {
            const user = yield user_services_1.default.getUserById(sellerId);
            if (!user) {
                throw new ApiError_1.default(404, 'User not found');
            }
            const where = {
                sellerId,
                orderType: 'CUSTOMER_ORDER',
            };
            const skip = (Math.max(1, page) - 1) * Math.min(Math.max(1, limit), 100);
            const orders = yield prisma_1.default.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Math.min(Math.max(1, limit), 100),
                select: {
                    orderId: true,
                    customerName: true,
                    customerPhoneNo: true,
                    actualCommission: true,
                    createdAt: true,
                    orderStatus: true,
                    OrderProduct: {
                        select: {
                            productName: true,
                            productImage: true,
                            productQuantity: true,
                        },
                    },
                },
            });
            const totalOrders = yield prisma_1.default.order.count({ where });
            return {
                orders,
                totalOrders,
                currentPage: Math.max(1, page),
                totalPages: Math.ceil(totalOrders / Math.min(Math.max(1, limit), 100)),
                pageSize: Math.min(Math.max(1, limit), 100),
            };
        });
    }
    fraudChecker(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (this.fraudCheckCache.has(phoneNumber)) {
                return this.fraudCheckCache.get(phoneNumber);
            }
            const url = `https://fraudchecker.link/api/v1/qc/`;
            // now i need to hit the fraud checker API via axios with authentication token
            try {
                const params = new URLSearchParams();
                params.append('phone', phoneNumber);
                const response = yield axios_1.default.post('https://fraudchecker.link/api/v1/qc/', params, {
                    headers: {
                        Authorization: `Bearer ${process.env.FRAUD_CHECKER_TOKEN}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                console.log('Fraud check response:', response.status);
                this.fraudCheckCache.set(phoneNumber, response.data);
                return response.data;
            }
            catch (error) {
                // console.error('Error checking fraud:', error)
                if (error && typeof error === 'object' && 'response' in error) {
                    console.log('Error checking fraud:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
                    console.log('Error checking fraud status:', (_b = error.response) === null || _b === void 0 ? void 0 : _b.status);
                }
                else {
                    console.log('Error checking fraud:', error);
                }
                throw new ApiError_1.default((_c = error.response) === null || _c === void 0 ? void 0 : _c.status, (_d = error.response) === null || _d === void 0 ? void 0 : _d.data.message);
            }
        });
    }
}
exports.orderService = new OrderService();
