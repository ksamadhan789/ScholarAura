-- AlterTable
ALTER TABLE "events" ADD COLUMN "webhookSecret" TEXT;

-- Backfill existing rows with a random per-event secret before making the
-- column required — new rows get one automatically via Prisma's uuid() default.
UPDATE "events" SET "webhookSecret" = md5(random()::text || clock_timestamp()::text || id) WHERE "webhookSecret" IS NULL;

ALTER TABLE "events" ALTER COLUMN "webhookSecret" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "events_webhookSecret_key" ON "events"("webhookSecret");
