-- CreateTable
CREATE TABLE "event_waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_waitlist_userId_eventId_key" ON "event_waitlist"("userId", "eventId");

ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
