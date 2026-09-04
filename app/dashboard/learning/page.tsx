import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequestRefundButton } from "@/components/RequestRefundButton";

export default async function MyLearningPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const purchases = await prisma.coursePurchase.findMany({
    where: { userId: session.user.id, status: "SUCCESS" },
    include: { course: true },
    orderBy: { purchasedAt: "desc" },
  });

  const pendingRequests = await prisma.refundRequest.findMany({
    where: {
      status: "PENDING",
      coursePurchaseId: { in: purchases.map((p) => p.id) },
    },
    select: { coursePurchaseId: true },
  });
  const pendingPurchaseIds = new Set(pendingRequests.map((r) => r.coursePurchaseId));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">🎓 My learning</h1>

      {purchases.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t enrolled in any courses yet — let&apos;s fix that!{" "}
          <Link href="/courses" className="underline">
            Browse courses 🚀
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {purchases.map((purchase) => (
            <div
              key={purchase.course.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-gray-400"
            >
              <Link href={`/courses/${purchase.course.slug}`}>
                <h2 className="font-medium">{purchase.course.title}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">{purchase.course.category}</p>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/api/receipts/course/${purchase.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  🧾 Receipt
                </a>
                {Number(purchase.amount) > 0 && (
                  <RequestRefundButton
                    kind="course"
                    itemId={purchase.id}
                    isPending={pendingPurchaseIds.has(purchase.id)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
