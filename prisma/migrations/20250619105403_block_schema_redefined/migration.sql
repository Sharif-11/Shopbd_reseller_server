/*
  Warnings:

  - You are about to drop the column `actionType` on the `blocks` table. All the data in the column will be lost.
  - You are about to drop the column `blockedAt` on the `blocks` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `blocks` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `blocks` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `blocks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blocks" DROP COLUMN "actionType",
DROP COLUMN "blockedAt",
DROP COLUMN "expiresAt",
DROP COLUMN "reason",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "block_actions" (
    "actionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "actionType" "BlockActionType" NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_actions_pkey" PRIMARY KEY ("actionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "block_actions_blockId_actionType_key" ON "block_actions"("blockId", "actionType");

-- AddForeignKey
ALTER TABLE "block_actions" ADD CONSTRAINT "block_actions_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("blockId") ON DELETE RESTRICT ON UPDATE CASCADE;
