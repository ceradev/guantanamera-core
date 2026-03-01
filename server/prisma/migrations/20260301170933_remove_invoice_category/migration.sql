/*
  Warnings:

  - You are about to drop the column `category` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "category";

-- DropEnum
DROP TYPE "ExpenseCategory";
