/*
  Warnings:

  - Added the required column `finalOrderTotal` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "finalOrderTotal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "totalAddOnPrice" DECIMAL(15,2) NOT NULL DEFAULT 0.0;
