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
    include: {
      course: {
        include: {
          videos: { select: { id: true, orderIndex: true }, orderBy: { orderIndex: "asc" } },
        },
      },
    },
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

  const allVideoIds = purchases.flatMap((p) => p.course.videos.map((v) => v.id));
  const completedProgress = await prisma.courseProgress.findMany({
    where: { userId: session.user.id, courseVideoId: { in: allVideoIds }, completedAt: { not: null } },
    select: { courseVideoId: true },
  });
  const completedVideoIds = new Set(completedProgress.map((p) => p.courseVideoId));

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
          {purchases.map((purchase) => {
            const videos = purchase.course.videos;
            const totalVideos = videos.length;
            const completedCount = videos.filter((v) => completedVideoIds.has(v.id)).length;
            const percent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;
            const isComplete = totalVideos > 0 && completedCount === totalVideos;
            const nextVideo = videos.find((v) => !completedVideoIds.has(v.id)) ?? videos[0] ?? null;
            const continueLabel = isComplete ? "Review" : completedCount > 0 ? "Continue" : "Start";

            return (
              <div
                key={purchase.course.id}
                className="flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-gray-400"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
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

                {totalVideos > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded bg-gray-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded bg-brand-600"
                        style={{ width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-gray-500 dark:text-slate-400">
                      {completedCount}/{totalVideos} lectures · {percent}%
                    </span>
                    {nextVideo && (
                      <Link
                        href={`/courses/${purchase.course.slug}/lectures/${nextVideo.id}`}
                        className="shrink-0 rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white"
                      >
                        {continueLabel}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
