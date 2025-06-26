-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "paymentType" DROP NOT NULL,
ALTER COLUMN "amountPaidByCustomer" DROP NOT NULL,
ALTER COLUMN "actualCommission" DROP NOT NULL,
ALTER COLUMN "cashOnAmount" DROP NOT NULL;
