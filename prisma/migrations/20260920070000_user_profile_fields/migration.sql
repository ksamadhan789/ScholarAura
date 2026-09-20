-- AlterTable
ALTER TABLE "users" ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "achievements" JSONB,
ADD COLUMN "resumeFileId" TEXT,
ADD COLUMN "resumeName" TEXT;
