-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Seller', 'Admin', 'SuperAdmin');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('USER_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'ORDER_MANAGEMENT', 'WITHDRAWAL_MANAGEMENT', 'PAYMENT_MANAGEMENT', 'REPORT_VIEW', 'SETTINGS_MANAGEMENT', 'CONTENT_MANAGEMENT', 'ALL');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ALL', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'BLOCK');

-- CreateEnum
CREATE TYPE "BlockActionType" AS ENUM ('ORDER_REQUEST', 'WITHDRAW_REQUEST', 'PASSWORD_RESET', 'PAYMENT_REQUEST', 'WALLET_ADDITION', 'ALL');

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
    "reason" TEXT,
    "actionTypes" "BlockActionType"[],
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blockId")
);

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

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByPhone_fkey" FOREIGN KEY ("referredByPhone") REFERENCES "users"("phoneNo") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;
