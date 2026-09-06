-- CreateTable
CREATE TABLE "event_wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_wishlist_userId_eventId_key" ON "event_wishlist"("userId", "eventId");

-- CreateIndex
CREATE INDEX "event_wishlist_eventId_idx" ON "event_wishlist"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_wishlist_userId_competitionId_key" ON "competition_wishlist"("userId", "competitionId");

-- CreateIndex
CREATE INDEX "competition_wishlist_competitionId_idx" ON "competition_wishlist"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "job_wishlist_userId_jobId_key" ON "job_wishlist"("userId", "jobId");

-- CreateIndex
CREATE INDEX "job_wishlist_jobId_idx" ON "job_wishlist"("jobId");

-- AddForeignKey
ALTER TABLE "event_wishlist" ADD CONSTRAINT "event_wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_wishlist" ADD CONSTRAINT "event_wishlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_wishlist" ADD CONSTRAINT "competition_wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_wishlist" ADD CONSTRAINT "competition_wishlist_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_wishlist" ADD CONSTRAINT "job_wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_wishlist" ADD CONSTRAINT "job_wishlist_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
