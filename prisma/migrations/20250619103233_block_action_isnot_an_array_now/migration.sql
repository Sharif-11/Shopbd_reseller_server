/*
  Warnings:

  - You are about to drop the column `actionTypes` on the `blocks` table. All the data in the column will be lost.
  - Added the required column `actionType` to the `blocks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blocks" DROP COLUMN "actionTypes",
ADD COLUMN     "actionType" "BlockActionType" NOT NULL;
