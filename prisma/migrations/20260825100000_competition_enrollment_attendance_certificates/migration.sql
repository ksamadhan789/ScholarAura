-- AlterTable: competitions
ALTER TABLE "competitions" ADD COLUMN "organizer" TEXT;
ALTER TABLE "competitions" ADD COLUMN "googleFormUrl" TEXT;
ALTER TABLE "competitions" ADD COLUMN "googleFormNameEntryId" TEXT;
ALTER TABLE "competitions" ADD COLUMN "googleFormEmailEntryId" TEXT;
ALTER TABLE "competitions" ADD COLUMN "googleFormEnrollmentEntryId" TEXT;
ALTER TABLE "competitions" ADD COLUMN "googleSheetId" TEXT;
ALTER TABLE "competitions" ADD COLUMN "attendanceRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "competitions" ADD COLUMN "minAttendancePercent" INTEGER;
ALTER TABLE "competitions" ADD COLUMN "certificateEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "competitions" ADD COLUMN "certificateType" TEXT DEFAULT 'PARTICIPATION';
ALTER TABLE "competitions" ADD COLUMN "googleSlidesTemplateId" TEXT;
ALTER TABLE "competitions" ADD COLUMN "certificateSignatoryName" TEXT;
ALTER TABLE "competitions" ADD COLUMN "certificateSignatoryTitle" TEXT;

-- AlterTable: competitions.webhookSecret (added nullable, backfilled, then required)
ALTER TABLE "competitions" ADD COLUMN "webhookSecret" TEXT;
UPDATE "competitions" SET "webhookSecret" = md5(random()::text || clock_timestamp()::text || id) WHERE "webhookSecret" IS NULL;
ALTER TABLE "competitions" ALTER COLUMN "webhookSecret" SET NOT NULL;
CREATE UNIQUE INDEX "competitions_webhookSecret_key" ON "competitions"("webhookSecret");

-- AlterTable: competition_entries
ALTER TABLE "competition_entries" ADD COLUMN "certificateName" TEXT;
ALTER TABLE "competition_entries" ADD COLUMN "enrollmentNumber" TEXT;
ALTER TABLE "competition_entries" ADD COLUMN "formSubmitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "competition_entries" ADD COLUMN "formSubmissionDate" TIMESTAMP(3);
ALTER TABLE "competition_entries" ADD COLUMN "googleResponseId" TEXT;
ALTER TABLE "competition_entries" ADD COLUMN "attendancePercent" INTEGER;
ALTER TABLE "competition_entries" ADD COLUMN "attendanceVerifiedAt" TIMESTAMP(3);
ALTER TABLE "competition_entries" ADD COLUMN "eligibleForCertificate" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "competition_entries_enrollmentNumber_key" ON "competition_entries"("enrollmentNumber");
CREATE UNIQUE INDEX "competition_entries_googleResponseId_key" ON "competition_entries"("googleResponseId");

-- AlterTable: certificates
ALTER TABLE "certificates" ADD COLUMN "competitionId" TEXT;
CREATE UNIQUE INDEX "certificates_userId_competitionId_key" ON "certificates"("userId", "competitionId");
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
