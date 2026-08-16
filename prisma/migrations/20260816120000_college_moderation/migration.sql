-- CreateEnum
CREATE TYPE "CollegeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "colleges" ADD COLUMN "city" TEXT;
ALTER TABLE "colleges" ADD COLUMN "state" TEXT;
ALTER TABLE "colleges" ADD COLUMN "university" TEXT;
ALTER TABLE "colleges" ADD COLUMN "collegeType" TEXT;
ALTER TABLE "colleges" ADD COLUMN "status" "CollegeStatus" NOT NULL DEFAULT 'APPROVED';
