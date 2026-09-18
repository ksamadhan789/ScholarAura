-- CreateTable
CREATE TABLE "freelance_threads" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freelance_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelance_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freelance_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "freelance_threads_listingId_initiatorId_key" ON "freelance_threads"("listingId", "initiatorId");

-- CreateIndex
CREATE INDEX "freelance_threads_listingId_idx" ON "freelance_threads"("listingId");

-- CreateIndex
CREATE INDEX "freelance_threads_initiatorId_idx" ON "freelance_threads"("initiatorId");

-- CreateIndex
CREATE INDEX "freelance_messages_threadId_createdAt_idx" ON "freelance_messages"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "freelance_threads" ADD CONSTRAINT "freelance_threads_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "freelance_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_threads" ADD CONSTRAINT "freelance_threads_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_messages" ADD CONSTRAINT "freelance_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "freelance_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_messages" ADD CONSTRAINT "freelance_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
