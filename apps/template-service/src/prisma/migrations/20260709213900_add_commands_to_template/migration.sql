/*
  Warnings:

  - Added the required column `buildCmd` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `installCmd` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startCmd` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "buildCmd" TEXT NOT NULL,
ADD COLUMN     "installCmd" TEXT NOT NULL,
ADD COLUMN     "startCmd" TEXT NOT NULL;
