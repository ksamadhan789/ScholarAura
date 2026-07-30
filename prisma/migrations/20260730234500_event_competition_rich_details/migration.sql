-- AlterTable
ALTER TABLE "events"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "eligibility" TEXT,
  ADD COLUMN "registrationStartDate" TIMESTAMP(3),
  ADD COLUMN "registrationDeadline" TIMESTAMP(3),
  ADD COLUMN "resultDate" TIMESTAMP(3),
  ADD COLUMN "prizeDescription" TEXT,
  ADD COLUMN "people" JSONB;

-- AlterTable
ALTER TABLE "competitions"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "eligibility" TEXT,
  ADD COLUMN "registrationStartDate" TIMESTAMP(3),
  ADD COLUMN "resultDate" TIMESTAMP(3),
  ADD COLUMN "people" JSONB;
