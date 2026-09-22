-- AlterTable
ALTER TABLE "users" ADD COLUMN "idCardFileId" TEXT,
ADD COLUMN "idCardFileName" TEXT,
ADD COLUMN "idCardContentType" TEXT;

-- AlterTable
ALTER TABLE "competition_entries" ADD COLUMN "submissionFileId" TEXT,
ADD COLUMN "submissionFileName" TEXT,
ADD COLUMN "submissionFileContentType" TEXT;
