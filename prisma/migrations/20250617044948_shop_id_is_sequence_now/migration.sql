/*
  Warnings:

  - The primary key for the `shops` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `shopId` column on the `shops` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `shopId` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `shopId` on the `shop_categories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_shopId_fkey";

-- DropForeignKey
ALTER TABLE "shop_categories" DROP CONSTRAINT "shop_categories_shopId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "shopId",
ADD COLUMN     "shopId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shop_categories" DROP COLUMN "shopId",
ADD COLUMN     "shopId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "shops" DROP CONSTRAINT "shops_pkey",
DROP COLUMN "shopId",
ADD COLUMN     "shopId" SERIAL NOT NULL,
ADD CONSTRAINT "shops_pkey" PRIMARY KEY ("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_categories_shopId_categoryId_key" ON "shop_categories"("shopId", "categoryId");

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("shopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("shopId") ON DELETE RESTRICT ON UPDATE CASCADE;
