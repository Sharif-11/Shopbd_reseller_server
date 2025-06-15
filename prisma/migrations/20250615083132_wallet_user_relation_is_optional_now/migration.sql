-- AlterEnum
ALTER TYPE "PermissionType" ADD VALUE 'REPORT_VIEW';

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_userId_fkey";

-- AlterTable
ALTER TABLE "wallets" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
