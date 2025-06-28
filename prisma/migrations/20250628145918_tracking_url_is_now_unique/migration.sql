/*
  Warnings:

  - A unique constraint covering the columns `[trackingUrl]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingUrl_key" ON "Order"("trackingUrl");
