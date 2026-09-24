-- Catch-up migration: brings a database built purely from prisma/migrations
-- in line with prisma/schema.prisma. These objects were added to the schema
-- (referral credit, affiliates, multi-currency, external courses, webinars,
-- one-certificate-per-course/event) and applied to the live database without
-- a migration file, so `prisma migrate deploy` on a fresh database produced
-- an incomplete schema.
--
-- The live database already has all of this, so every statement is written
-- to be a no-op when the object exists (IF NOT EXISTS / existence checks).
-- Steps that could fail on unexpected existing data (unique indexes, foreign
-- keys) catch the error and emit a NOTICE instead of failing the deploy —
-- leaving that database exactly as it was before this migration.

-- Enums --------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "CreditTransactionType" AS ENUM ('EARNED', 'REDEEMED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'WEBINAR';

-- Columns ------------------------------------------------------------------

ALTER TABLE "course_purchases"
  ADD COLUMN IF NOT EXISTS "chargedAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "creditApplied" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE "event_registrations"
  ADD COLUMN IF NOT EXISTS "chargedAmount" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "creditApplied" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "affiliateRatePercent" INTEGER,
  ADD COLUMN IF NOT EXISTS "creditBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredById" TEXT;

-- Tables -------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "exchange_rates" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rateFromInr" DECIMAL(12,6) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "external_courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_courses_pkey" PRIMARY KEY ("id")
);

-- Unique indexes (non-fatal if existing rows would violate them) ------------

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "exchange_rates_currencyCode_key" ON "exchange_rates"("currencyCode");
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipped exchange_rates_currencyCode_key: duplicate currency codes exist';
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "certificates_userId_courseId_key" ON "certificates"("userId", "courseId");
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipped certificates_userId_courseId_key: duplicate course certificates exist';
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "certificates_userId_eventId_key" ON "certificates"("userId", "eventId");
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipped certificates_userId_eventId_key: duplicate event certificates exist';
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key" ON "users"("referralCode");
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipped users_referralCode_key: duplicate referral codes exist';
END $$;

-- Foreign keys (added only if missing; non-fatal on bad existing data) ------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_referredById_fkey') THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_referredById_fkey"
      FOREIGN KEY ("referredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
EXCEPTION WHEN foreign_key_violation THEN
  RAISE NOTICE 'Skipped users_referredById_fkey: referredById points at missing users';
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_userId_fkey') THEN
    ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
EXCEPTION WHEN foreign_key_violation THEN
  RAISE NOTICE 'Skipped credit_transactions_userId_fkey: rows point at missing users';
END $$;

-- refund_requests: 20260904220000_refund_requests created these three links
-- as ON DELETE RESTRICT, but the schema's optional relations mean ON DELETE
-- SET NULL (Prisma's default). Nothing in the app deletes purchases,
-- registrations or entries, so this only aligns the database with the
-- schema. Each link is replaced only when it isn't already SET NULL
-- (confdeltype 'n'); if re-adding fails, the block rolls back and the
-- original constraint stays.
DO $$
DECLARE
  link RECORD;
BEGIN
  FOR link IN
    SELECT * FROM (VALUES
      ('refund_requests_coursePurchaseId_fkey', 'coursePurchaseId', 'course_purchases'),
      ('refund_requests_eventRegistrationId_fkey', 'eventRegistrationId', 'event_registrations'),
      ('refund_requests_competitionEntryId_fkey', 'competitionEntryId', 'competition_entries')
    ) AS t(conname, col, target)
  LOOP
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = link.conname AND confdeltype = 'n'
      ) THEN
        EXECUTE format('ALTER TABLE "refund_requests" DROP CONSTRAINT IF EXISTS %I', link.conname);
        EXECUTE format(
          'ALTER TABLE "refund_requests" ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I("id") ON DELETE SET NULL ON UPDATE CASCADE',
          link.conname, link.col, link.target
        );
      END IF;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE NOTICE 'Kept existing % unchanged: rows point at missing records', link.conname;
    END;
  END LOOP;
END $$;
