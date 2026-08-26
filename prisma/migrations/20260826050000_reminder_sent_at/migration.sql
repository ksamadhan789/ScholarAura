-- AlterTable
ALTER TABLE "event_registrations" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "competition_entries" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
