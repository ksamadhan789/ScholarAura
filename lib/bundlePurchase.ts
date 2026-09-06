import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Grants access to every course in a bundle by fanning out into ordinary
 * CoursePurchase rows (amount 0 — the money was collected on the
 * BundlePurchase itself), so every existing access check — enrollment,
 * certificates, quizzes, downloadable resources — needs no bundle-awareness
 * at all. Safe to call for a course the student already owns individually:
 * the upsert just re-affirms SUCCESS without touching what was already paid.
 */
async function grantBundleCourseAccess(
  tx: Prisma.TransactionClient,
  userId: string,
  courseIds: string[]
) {
  for (const courseId of courseIds) {
    await tx.coursePurchase.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { status: "SUCCESS" },
      create: { userId, courseId, amount: 0, status: "SUCCESS" },
    });
    await tx.courseWishlist.deleteMany({ where: { userId, courseId } });
  }
}

/**
 * Marks a bundle purchase SUCCESS and grants access to every course in it —
 * guarded so this can be called more than once for the same purchase
 * (browser confirmation and the Razorpay webhook both call this) without
 * re-running the fan-out unnecessarily.
 */
export async function settleBundlePurchase(bundlePurchaseId: string, paymentId: string) {
  const bundlePurchase = await prisma.bundlePurchase.findUnique({ where: { id: bundlePurchaseId } });
  if (!bundlePurchase) return null;

  const bundle = await prisma.courseBundle.findUnique({
    where: { id: bundlePurchase.bundleId },
    include: { items: { select: { courseId: true } } },
  });
  if (!bundle) return null;

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.bundlePurchase.updateMany({
      where: { id: bundlePurchase.id, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", razorpayPaymentId: paymentId },
    });

    if (claimed.count > 0) {
      await grantBundleCourseAccess(
        tx,
        bundlePurchase.userId,
        bundle.items.map((item) => item.courseId)
      );
    }

    return tx.bundlePurchase.findUniqueOrThrow({ where: { id: bundlePurchase.id } });
  });
}

export async function enrollFreeBundle(userId: string, bundleId: string, courseIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.bundlePurchase.upsert({
      where: { userId_bundleId: { userId, bundleId } },
      update: { status: "SUCCESS", amount: 0 },
      create: { userId, bundleId, amount: 0, status: "SUCCESS" },
    });
    await grantBundleCourseAccess(tx, userId, courseIds);
    return purchase;
  });
}
