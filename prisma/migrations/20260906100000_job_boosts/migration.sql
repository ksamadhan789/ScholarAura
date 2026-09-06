-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "featuredUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "job_boosts" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "purchasedByUserId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "chargedAmount" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "expiresAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_boosts_jobId_idx" ON "job_boosts"("jobId");

-- AddForeignKey
ALTER TABLE "job_boosts" ADD CONSTRAINT "job_boosts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_boosts" ADD CONSTRAINT "job_boosts_purchasedByUserId_fkey" FOREIGN KEY ("purchasedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
