-- AlterTable
ALTER TABLE "events"
  ADD COLUMN "prizeFirst" TEXT,
  ADD COLUMN "prizeSecond" TEXT,
  ADD COLUMN "prizeThird" TEXT;

-- AlterTable
ALTER TABLE "competitions"
  ADD COLUMN "prizeFirst" TEXT,
  ADD COLUMN "prizeSecond" TEXT,
  ADD COLUMN "prizeThird" TEXT;
