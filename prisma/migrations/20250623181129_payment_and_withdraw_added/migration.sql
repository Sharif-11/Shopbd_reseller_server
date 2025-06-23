-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ORDER_PAYMENT', 'WITHDRAWAL_PAYMENT', 'DUE_PAYMENT');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('SELLER', 'SYSTEM', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "WithdrawStaus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "withdraws" (
    "withdrawId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "withdrawStatus" "WithdrawStaus" NOT NULL DEFAULT 'PENDING',
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

    CONSTRAINT "payments_pkey" PRIMARY KEY ("paymentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");
