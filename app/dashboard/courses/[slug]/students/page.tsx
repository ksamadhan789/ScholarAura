import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RefundButton } from "@/components/RefundButton";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";

const STATUS_VARIANT = {
  SUCCESS: "success",
  PENDING: "warning",
  FAILED: "neutral",
  REFUNDED: "neutral",
} as const;

export default async function CourseStudentsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { videos: { select: { id: true } } },
  });
  if (!course) {
    notFound();
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    redirect("/dashboard/courses");
  }

  const totalVideos = course.videos.length;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [purchases, totalCount, progressCounts] = await Promise.all([
    prisma.coursePurchase.findMany({
      where: { courseId: course.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { purchasedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.coursePurchase.count({ where: { courseId: course.id } }),
    prisma.courseProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { not: null }, courseVideo: { courseId: course.id } },
      _count: { _all: true },
    }),
  ]);

  const completedByUser = new Map(progressCounts.map((p) => [p.userId, p._count._all]));

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Link
        href={`/dashboard/courses/${course.slug}`}
        className="text-sm text-gray-500 hover:underline dark:text-slate-400"
      >
        ← {course.title}
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
        <a
          href={`/api/admin/courses/${course.slug}/students/export`}
          className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      {purchases.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No one has purchased this course yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Purchased</th>
                <th className="px-4 py-2.5 font-medium">Payment status</th>
                <th className="px-4 py-2.5 font-medium">Progress</th>
                {isAdmin && <th className="px-4 py-2.5 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const completed = completedByUser.get(purchase.userId) ?? 0;
                const percent = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;
                return (
                  <tr key={purchase.id} className="border-t border-gray-200 dark:border-slate-700">
                    <td className="px-4 py-2.5">{purchase.user.name}</td>
                    <td className="px-4 py-2.5">
                      <a href={`mailto:${purchase.user.email}`} className="underline">
                        {purchase.user.email}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {purchase.purchasedAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={STATUS_VARIANT[purchase.status]}>{purchase.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {purchase.status === "SUCCESS" && totalVideos > 0
                        ? `${percent}% (${completed}/${totalVideos})`
                        : "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5">
                        {purchase.status === "SUCCESS" && (
                          <RefundButton refundUrl={`/api/admin/course-purchases/${purchase.id}/refund`} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} basePath={`/dashboard/courses/${course.slug}/students`} />
    </main>
  );
}
