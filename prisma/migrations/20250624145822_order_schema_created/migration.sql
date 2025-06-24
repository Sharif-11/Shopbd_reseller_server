/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SELLER_ORDER', 'CUSTOMER_ORDER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('UNPAID', 'PAID', 'CONFIRMED', 'DELIVERED', 'COMPLETED', 'RETURNED', 'REFUNDED', 'FAILED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderUser" AS ENUM ('SELLER', 'CUSTOMER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET', 'BALANCE');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "orderId" INTEGER;

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
    "paymentType" "PaymentMethod" NOT NULL,
    "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalProductQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalProductSellingPrice" DECIMAL(15,2) NOT NULL,
    "totalProductBasePrice" DECIMAL(15,2) NOT NULL,
    "totalCommission" DECIMAL(15,2) NOT NULL,
    "amountPaidByCustomer" DECIMAL(15,2) NOT NULL,
    "actualCommission" DECIMAL(15,2) NOT NULL,
    "cashOnAmount" DECIMAL(15,2) NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- AddForeignKey
ALTER TABLE "OrderProduct" ADD CONSTRAINT "OrderProduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE SET NULL ON UPDATE CASCADE;
