-- CreateEnum
CREATE TYPE "TemplateEnvironment" AS ENUM ('BROWSER', 'SERVER');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "technologies" TEXT[],
    "language" TEXT NOT NULL,
    "environment" "TemplateEnvironment" NOT NULL,
    "folderUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");
