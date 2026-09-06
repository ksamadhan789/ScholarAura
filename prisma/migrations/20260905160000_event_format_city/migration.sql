-- CreateEnum
CREATE TYPE "EventFormat" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- AlterTable
ALTER TABLE "events" ADD COLUMN "format" "EventFormat";
ALTER TABLE "events" ADD COLUMN "city" TEXT;

-- Backfill from the boolean it replaces before dropping it.
UPDATE "events" SET "format" = CASE WHEN "isOnline" THEN 'ONLINE' ELSE 'OFFLINE' END::"EventFormat";

ALTER TABLE "events" ALTER COLUMN "format" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "format" SET DEFAULT 'OFFLINE';
ALTER TABLE "events" DROP COLUMN "isOnline";
