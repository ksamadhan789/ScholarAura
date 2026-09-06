-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "stipendRange" TEXT,
ADD COLUMN "durationMonths" INTEGER,
ADD COLUMN "internshipStartDate" TIMESTAMP(3),
ADD COLUMN "perks" JSONB;
