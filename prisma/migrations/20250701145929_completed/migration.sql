-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Seller', 'Admin', 'SuperAdmin');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('USER_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'ORDER_MANAGEMENT', 'WITHDRAWAL_MANAGEMENT', 'PAYMENT_MANAGEMENT', 'WALLET_MANAGEMENT', 'ROLE_PERMISSIONS', 'SUPPORT_TICKET_MANAGEMENT', 'DASHBOARD_ANALYTICS', 'OTHER', 'ALL');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ALL', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'BLOCK', 'NOTIFY');

-- CreateEnum
CREATE TYPE "BlockActionType" AS ENUM ('ORDER_REQUEST', 'WITHDRAW_REQUEST', 'PASSWORD_RESET', 'PAYMENT_REQUEST', 'WALLET_ADDITION', 'ALL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ORDER_PAYMENT', 'WITHDRAWAL_PAYMENT', 'DUE_PAYMENT');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('SELLER', 'SYSTEM', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SELLER_ORDER', 'CUSTOMER_ORDER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('UNPAID', 'PAID', 'CONFIRMED', 'DELIVERED', 'COMPLETED', 'RETURNED', 'REFUNDED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderUser" AS ENUM ('SELLER', 'CUSTOMER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET', 'BALANCE');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('SELLER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ACCOUNT', 'PAYMENT', 'ORDER', 'PRODUCT', 'WITHDRAWAL', 'TECHNICAL', 'OTHER');

-- CreateTable
CREATE TABLE "otp" (
    "id" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "totalOTP" INTEGER NOT NULL DEFAULT 0,
    "otp" TEXT NOT NULL,
    "otpCreatedAt" TIMESTAMP(3) NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpBlockUntil" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "userId" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordSendsAt" TIMESTAMP(3),
    "totalPasswordResetRequests" INTEGER NOT NULL DEFAULT 0,
    "role" "UserType" NOT NULL DEFAULT 'Seller',
    "zilla" TEXT,
    "upazilla" TEXT,
    "address" TEXT,
    "referralCode" TEXT,
    "referredByPhone" TEXT,
    "email" TEXT,
    "isVerified" BOOLEAN DEFAULT false,
    "balance" DECIMAL(15,2) DEFAULT 0.0,
    "shopName" TEXT,
    "nomineePhone" TEXT,
    "facebookProfileLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "customers" (
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhoneNo" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Customer',
    "sellerId" TEXT NOT NULL,
    "sellerCode" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "roles" (
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL DEFAULT 'Seller',
    "roleDescription" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "rolePermissionId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permission" "PermissionType" NOT NULL,
    "actions" "ActionType"[],

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("rolePermissionId")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userRoleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userRoleId")
);

-- CreateTable
CREATE TABLE "blocks" (
    "blockId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhoneNo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blockId")
);

-- CreateTable
CREATE TABLE "block_actions" (
    "actionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "actionType" "BlockActionType" NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_actions_pkey" PRIMARY KEY ("actionId")
);

-- CreateTable
CREATE TABLE "wallets" (
    "walletId" SERIAL NOT NULL,
    "walletName" TEXT NOT NULL,
    "walletPhoneNo" TEXT NOT NULL,
    "walletType" "WalletType" NOT NULL DEFAULT 'SELLER',
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("walletId")
);

-- CreateTable
CREATE TABLE "wallet_otp" (
    "id" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "totalOTP" INTEGER NOT NULL DEFAULT 0,
    "otp" TEXT NOT NULL,
    "otpCreatedAt" TIMESTAMP(3) NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpBlockUntil" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "shopId" SERIAL NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopLocation" TEXT NOT NULL,
    "shopIcon" TEXT,
    "deliveryChargeInside" DECIMAL(10,2) NOT NULL,
    "deliveryChargeOutside" DECIMAL(10,2) NOT NULL,
    "shopDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("shopId")
);

-- CreateTable
CREATE TABLE "categories" (
    "categoryId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryIcon" TEXT,
    "description" TEXT,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("categoryId")
);

-- CreateTable
CREATE TABLE "shop_categories" (
    "shopCategoryId" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_categories_pkey" PRIMARY KEY ("shopCategoryId")
);

-- CreateTable
CREATE TABLE "products" (
    "productId" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT,
    "basePrice" DECIMAL(15,2) NOT NULL,
    "suggestedMaxPrice" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "product_images" (
    "imageId" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "featureVector" JSONB,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("imageId")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "variantId" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("variantId")
);

-- CreateTable
CREATE TABLE "Order" (
    "orderId" SERIAL NOT NULL,
    "orderType" "OrderType" NOT NULL DEFAULT 'SELLER_ORDER',
    "orderStatus" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" "OrderUser",
    "cancelledReason" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhoneNo" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerZilla" TEXT NOT NULL,
    "customerUpazilla" TEXT NOT NULL,
    "customerComments" TEXT,
    "shopId" INTEGER NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopLocation" TEXT NOT NULL,
    "deliveryCharge" DECIMAL(10,2) NOT NULL,
    "sellerId" TEXT,
    "sellerName" TEXT,
    "sellerPhoneNo" TEXT,
    "sellerVerified" BOOLEAN DEFAULT false,
    "sellerShopName" TEXT,
    "sellerBalance" DECIMAL(15,2) DEFAULT 0.0,
    "courierName" TEXT,
    "trackingUrl" TEXT,
    "isDeliveryChargePaid" BOOLEAN NOT NULL DEFAULT false,
    "deliveryChargePaidAt" TIMESTAMP(3),
    "paymentType" "PaymentMethod",
    "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalProductQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalProductSellingPrice" DECIMAL(15,2) NOT NULL,
    "totalProductBasePrice" DECIMAL(15,2) NOT NULL,
    "totalCommission" DECIMAL(15,2) NOT NULL,
    "amountPaidByCustomer" DECIMAL(15,2),
    "actualCommission" DECIMAL(15,2),
    "cashOnAmount" DECIMAL(15,2),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "OrderProduct" (
    "orderProductId" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productImage" TEXT,
    "productBasePrice" DECIMAL(15,2) NOT NULL,
    "productSellingPrice" DECIMAL(15,2) NOT NULL,
    "productQuantity" INTEGER NOT NULL DEFAULT 1,
    "productVariant" TEXT,
    "totalProductBasePrice" DECIMAL(15,2) NOT NULL,
    "totalProductSellingPrice" DECIMAL(15,2) NOT NULL,
    "totalProductQuantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderProduct_pkey" PRIMARY KEY ("orderProductId")
);

-- CreateTable
CREATE TABLE "withdraws" (
    "withdrawId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "withdrawStatus" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhoneNo" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "transactionFee" DECIMAL(15,2),
    "actualAmount" DECIMAL(15,2),
    "transactionId" TEXT,
    "walletName" TEXT NOT NULL,
    "walletPhoneNo" TEXT NOT NULL,
    "systemWalletPhoneNo" TEXT,
    "paymentId" TEXT,
    "remarks" TEXT,

    CONSTRAINT "withdraws_pkey" PRIMARY KEY ("withdrawId")
);

-- CreateTable
CREATE TABLE "payments" (
    "paymentId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "PaymentType" NOT NULL,
    "processedAt" TIMESTAMP(3),
    "sender" "SenderType" NOT NULL,
    "userWalletName" TEXT NOT NULL,
    "userWalletPhoneNo" TEXT NOT NULL,
    "systemWalletName" TEXT,
    "systemWalletPhoneNo" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "transactionId" TEXT,
    "transactionFee" DECIMAL(15,2),
    "actualAmount" DECIMAL(15,2),
    "userName" TEXT NOT NULL,
    "userPhoneNo" TEXT NOT NULL,
    "remarks" TEXT,
    "orderId" INTEGER,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("paymentId")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhoneNo" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" JSONB,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "startPrice" DECIMAL(15,2) NOT NULL,
    "endPrice" DECIMAL(15,2),
    "commission" DECIMAL(15,2) NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "announcements" JSONB[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "ticketId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "TicketCategory" NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "userName" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "userEmail" TEXT,
    "shopName" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("ticketId")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "messageId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT,
    "content" TEXT NOT NULL,
    "attachments" TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("messageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "otp_phoneNo_key" ON "otp"("phoneNo");

-- CreateIndex
CREATE INDEX "contactIndex" ON "otp"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNo_key" ON "users"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "userIndex" ON "users"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerPhoneNo_key" ON "customers"("customerPhoneNo");

-- CreateIndex
CREATE INDEX "customerPhoneIndex" ON "customers"("customerPhoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleName_key" ON "roles"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permission_key" ON "role_permissions"("roleId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE INDEX "blockUserPhoneIndex" ON "blocks"("userPhoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "block_actions_blockId_actionType_key" ON "block_actions"("blockId", "actionType");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_walletName_walletPhoneNo_key" ON "wallets"("walletName", "walletPhoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_otp_phoneNo_key" ON "wallet_otp"("phoneNo");

-- CreateIndex
CREATE INDEX "walletOtpIndex" ON "wallet_otp"("phoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "shop_categories_shopId_categoryId_key" ON "shop_categories"("shopId", "categoryId");

-- CreateIndex
CREATE INDEX "productImageIndex" ON "product_images"("productId");

-- CreateIndex
CREATE INDEX "productVariantIndex" ON "product_variants"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_name_value_key" ON "product_variants"("productId", "name", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingUrl_key" ON "Order"("trackingUrl");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_startPrice_endPrice_level_key" ON "commissions"("startPrice", "endPrice", "level");

-- CreateIndex
CREATE UNIQUE INDEX "announcements_id_key" ON "announcements"("id");

-- CreateIndex
CREATE INDEX "ticketUserIndex" ON "support_tickets"("userId");

-- CreateIndex
CREATE INDEX "ticketStatusIndex" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "ticketPhoneIndex" ON "support_tickets"("userPhone");

-- CreateIndex
CREATE INDEX "messageTicketIndex" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE INDEX "messageSenderIndex" ON "ticket_messages"("senderId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByPhone_fkey" FOREIGN KEY ("referredByPhone") REFERENCES "users"("phoneNo") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_actions" ADD CONSTRAINT "block_actions_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("blockId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("categoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("shopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("shopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProduct" ADD CONSTRAINT "OrderProduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;
