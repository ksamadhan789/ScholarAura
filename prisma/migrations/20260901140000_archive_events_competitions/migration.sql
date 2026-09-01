-- AlterTable
ALTER TABLE "events" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "competitions" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
