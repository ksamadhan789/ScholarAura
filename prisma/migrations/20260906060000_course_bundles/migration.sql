-- CreateTable
CREATE TABLE "course_bundles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "thumbnailUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_bundle_items" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "course_bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "chargedAmount" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_bundles_slug_key" ON "course_bundles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "course_bundle_items_bundleId_courseId_key" ON "course_bundle_items"("bundleId", "courseId");

-- CreateIndex
CREATE INDEX "course_bundle_items_courseId_idx" ON "course_bundle_items"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_purchases_userId_bundleId_key" ON "bundle_purchases"("userId", "bundleId");

-- AddForeignKey
ALTER TABLE "course_bundle_items" ADD CONSTRAINT "course_bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "course_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bundle_items" ADD CONSTRAINT "course_bundle_items_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_purchases" ADD CONSTRAINT "bundle_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_purchases" ADD CONSTRAINT "bundle_purchases_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "course_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
