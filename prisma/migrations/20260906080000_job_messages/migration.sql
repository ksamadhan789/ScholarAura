-- CreateTable
CREATE TABLE "job_messages" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_messages_applicationId_createdAt_idx" ON "job_messages"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_messages" ADD CONSTRAINT "job_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
