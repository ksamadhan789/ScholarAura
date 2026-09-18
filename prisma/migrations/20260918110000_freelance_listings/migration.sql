-- CreateTable
CREATE TABLE "freelance_listings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" JSONB,
    "rate" TEXT,
    "portfolioUrl" TEXT,
    "contactEmail" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "postedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelance_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "freelance_listings_slug_key" ON "freelance_listings"("slug");

-- CreateIndex
CREATE INDEX "freelance_listings_category_idx" ON "freelance_listings"("category");

-- CreateIndex
CREATE INDEX "freelance_listings_postedByUserId_idx" ON "freelance_listings"("postedByUserId");

-- AddForeignKey
ALTER TABLE "freelance_listings" ADD CONSTRAINT "freelance_listings_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
