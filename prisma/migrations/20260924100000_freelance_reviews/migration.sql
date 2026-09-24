-- CreateTable
CREATE TABLE "freelance_reviews" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "freelance_reviews_listingId_reviewerId_key" ON "freelance_reviews"("listingId", "reviewerId");

-- CreateIndex
CREATE INDEX "freelance_reviews_listingId_idx" ON "freelance_reviews"("listingId");

-- AddForeignKey
ALTER TABLE "freelance_reviews" ADD CONSTRAINT "freelance_reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "freelance_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_reviews" ADD CONSTRAINT "freelance_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
