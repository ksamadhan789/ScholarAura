-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('NOT_ELIGIBLE', 'ELIGIBLE', 'PROCESSING', 'GENERATED', 'AVAILABLE', 'REVOKED', 'FAILED');

-- AlterTable: events
ALTER TABLE "events" ADD COLUMN "organizer" TEXT;
ALTER TABLE "events" ADD COLUMN "googleFormUrl" TEXT;
ALTER TABLE "events" ADD COLUMN "googleFormNameEntryId" TEXT;
ALTER TABLE "events" ADD COLUMN "googleFormEmailEntryId" TEXT;
ALTER TABLE "events" ADD COLUMN "googleFormEnrollmentEntryId" TEXT;
ALTER TABLE "events" ADD COLUMN "googleSheetId" TEXT;
ALTER TABLE "events" ADD COLUMN "attendanceRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "minAttendancePercent" INTEGER;
ALTER TABLE "events" ADD COLUMN "certificateEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "events" ADD COLUMN "certificateType" TEXT DEFAULT 'PARTICIPATION';
ALTER TABLE "events" ADD COLUMN "googleSlidesTemplateId" TEXT;
ALTER TABLE "events" ADD COLUMN "certificateSignatoryName" TEXT;
ALTER TABLE "events" ADD COLUMN "certificateSignatoryTitle" TEXT;

-- AlterTable: event_registrations
ALTER TABLE "event_registrations" ADD COLUMN "enrollmentNumber" TEXT;
ALTER TABLE "event_registrations" ADD COLUMN "formSubmitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "event_registrations" ADD COLUMN "formSubmissionDate" TIMESTAMP(3);
ALTER TABLE "event_registrations" ADD COLUMN "googleResponseId" TEXT;
ALTER TABLE "event_registrations" ADD COLUMN "attendancePercent" INTEGER;
ALTER TABLE "event_registrations" ADD COLUMN "attendanceVerifiedAt" TIMESTAMP(3);
ALTER TABLE "event_registrations" ADD COLUMN "eligibleForCertificate" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "event_registrations_enrollmentNumber_key" ON "event_registrations"("enrollmentNumber");
CREATE UNIQUE INDEX "event_registrations_googleResponseId_key" ON "event_registrations"("googleResponseId");

-- AlterTable: certificates
ALTER TABLE "certificates" ADD COLUMN "status" "CertificateStatus" NOT NULL DEFAULT 'GENERATED';
ALTER TABLE "certificates" ADD COLUMN "certificateType" TEXT;
ALTER TABLE "certificates" ADD COLUMN "attendancePercentage" INTEGER;
ALTER TABLE "certificates" ADD COLUMN "googleSlideFileId" TEXT;
ALTER TABLE "certificates" ADD COLUMN "googleDriveFileId" TEXT;
ALTER TABLE "certificates" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "certificates" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "certificates" ADD COLUMN "lastAttemptAt" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN "revokedAt" TIMESTAMP(3);
ALTER TABLE "certificates" ADD COLUMN "revokedReason" TEXT;
