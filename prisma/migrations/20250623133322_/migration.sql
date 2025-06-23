/*
  Warnings:

  - The values [CUSTOMER_MANAGEMENT,SELLER_MANAGEMENT,ADMIN_MANAGEMENT,DASHBOARD_ACCESS,SETTINGS_MANAGEMENT,CONTENT_MANAGEMENT,WALLET_ADDITION,REPORT_VIEW] on the enum `PermissionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PermissionType_new" AS ENUM ('USER_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'ORDER_MANAGEMENT', 'WITHDRAWAL_MANAGEMENT', 'PAYMENT_MANAGEMENT', 'WALLET_MANAGEMENT', 'ROLE_PERMISSIONS', 'ALL');
ALTER TABLE "role_permissions" ALTER COLUMN "permission" TYPE "PermissionType_new" USING ("permission"::text::"PermissionType_new");
ALTER TYPE "PermissionType" RENAME TO "PermissionType_old";
ALTER TYPE "PermissionType_new" RENAME TO "PermissionType";
DROP TYPE "PermissionType_old";
COMMIT;
