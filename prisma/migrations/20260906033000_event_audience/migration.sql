-- CreateEnum
CREATE TYPE "EventAudience" AS ENUM ('STUDENT', 'PROFESSIONAL', 'EVERYONE');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "audience" "EventAudience" NOT NULL DEFAULT 'EVERYONE';
