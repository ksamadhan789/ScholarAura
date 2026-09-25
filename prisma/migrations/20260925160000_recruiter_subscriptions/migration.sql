-- CreateEnum
CREATE TYPE "RecruiterPlanPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "recruiter_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "RecruiterPlanPeriod" NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "chargedAmount" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_subscriptions_razorpayOrderId_key" ON "recruiter_subscriptions"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "recruiter_subscriptions_userId_status_idx" ON "recruiter_subscriptions"("userId", "status");

-- AddForeignKey
ALTER TABLE "recruiter_subscriptions" ADD CONSTRAINT "recruiter_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
