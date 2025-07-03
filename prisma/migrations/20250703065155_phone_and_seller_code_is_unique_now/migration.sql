/*
  Warnings:

  - A unique constraint covering the columns `[customerPhoneNo,sellerId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "customers_customerPhoneNo_sellerId_key" ON "customers"("customerPhoneNo", "sellerId");
