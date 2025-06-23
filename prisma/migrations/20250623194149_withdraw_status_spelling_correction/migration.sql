/*
  Warnings:

  - The `withdrawStatus` column on the `withdraws` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "withdraws" DROP COLUMN "withdrawStatus",
ADD COLUMN     "withdrawStatus" "WithdrawStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "WithdrawStaus";
