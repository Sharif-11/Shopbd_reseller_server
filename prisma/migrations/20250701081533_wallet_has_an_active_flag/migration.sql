-- AlterEnum
ALTER TYPE "ActionType" ADD VALUE 'NOTIFY';

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
