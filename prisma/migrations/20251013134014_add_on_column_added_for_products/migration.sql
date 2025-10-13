/*
  Warnings:

  - Added the required column `finalProductPrice` to the `OrderProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderProduct" ADD COLUMN     "finalProductPrice" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "selectedAddOns" JSONB,
ADD COLUMN     "totalAddOnPrice" DECIMAL(15,2) NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "addOns" JSONB;
