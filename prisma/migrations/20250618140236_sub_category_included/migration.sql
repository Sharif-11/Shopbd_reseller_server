-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("categoryId") ON DELETE SET NULL ON UPDATE CASCADE;
