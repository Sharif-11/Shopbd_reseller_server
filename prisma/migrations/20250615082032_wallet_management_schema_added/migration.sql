/*
  Warnings:

  - The values [REPORT_VIEW] on the enum `PermissionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('SELLER', 'SYSTEM');

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionType_new" AS ENUM ('USER_MANAGEMENT', 'CUSTOMER_MANAGEMENT', 'SELLER_MANAGEMENT', 'ADMIN_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'ORDER_MANAGEMENT', 'WITHDRAWAL_MANAGEMENT', 'PAYMENT_MANAGEMENT', 'DASHBOARD_ACCESS', 'SETTINGS_MANAGEMENT', 'CONTENT_MANAGEMENT', 'WALLET_ADDITION', 'WALLET_MANAGEMENT', 'ALL');
ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "PermissionType_new" USING ("permission"::text::"PermissionType_new");
ALTER TYPE "PermissionType" RENAME TO "PermissionType_old";
ALTER TYPE "PermissionType_new" RENAME TO "PermissionType";
DROP TYPE "PermissionType_old";
COMMIT;

-- CreateTable
CREATE TABLE "wallets" (
    "walletId" SERIAL NOT NULL,
    "walletName" TEXT NOT NULL,
    "walletPhoneNo" TEXT NOT NULL,
    "walletType" "WalletType" NOT NULL DEFAULT 'SELLER',
    "userId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "wallets_walletName_walletPhoneNo_key" ON "wallets"("walletName", "walletPhoneNo");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_otp_phoneNo_key" ON "wallet_otp"("phoneNo");

-- CreateIndex
CREATE INDEX "walletOtpIndex" ON "wallet_otp"("phoneNo");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
