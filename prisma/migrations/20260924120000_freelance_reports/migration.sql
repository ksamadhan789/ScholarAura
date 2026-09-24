-- CreateEnum
CREATE TYPE "FreelanceReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

-- AlterTable
ALTER TABLE "freelance_listings" ADD COLUMN "removedByAdminAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "freelance_reports" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "FreelanceReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "freelance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "freelance_reports_status_createdAt_idx" ON "freelance_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "freelance_reports_listingId_idx" ON "freelance_reports"("listingId");

-- AddForeignKey
ALTER TABLE "freelance_reports" ADD CONSTRAINT "freelance_reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "freelance_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_reports" ADD CONSTRAINT "freelance_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
