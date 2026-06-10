/*
  Warnings:

  - The values [BOOTING,LOADING_FILES,INSTALLING_DEPENDENCIES,READY,ERROR,STOPPED] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('CREATED', 'RUNNING', 'PAUSED', 'RESTARTING', 'REMOVING', 'EXITED', 'DEAD');
ALTER TABLE "public"."Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING ("status"::text::"ProjectStatus_new");
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "public"."ProjectStatus_old";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'DEAD';
COMMIT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "containerUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DEAD';
