-- CreateTable
CREATE TABLE "job_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT,
    "employmentType" "EmploymentType",
    "remoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_alert_deliveries" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_alert_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_alerts_userId_idx" ON "job_alerts"("userId");

-- CreateIndex
CREATE INDEX "job_alerts_isActive_idx" ON "job_alerts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "job_alert_deliveries_alertId_jobId_key" ON "job_alert_deliveries"("alertId", "jobId");

-- AddForeignKey
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_alert_deliveries" ADD CONSTRAINT "job_alert_deliveries_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "job_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_alert_deliveries" ADD CONSTRAINT "job_alert_deliveries_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
