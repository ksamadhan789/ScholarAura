import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RefundButton } from "@/components/RefundButton";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";
import { Download, Users } from "lucide-react";

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
    <DashboardShell
      title="Students"
      description={course.title}
      backHref={`/dashboard/courses/${course.slug}`}
      backLabel={course.title}
      actions={
        <a href={`/api/admin/courses/${course.slug}/students/export`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
          <Download aria-hidden className="h-4 w-4" />
          Export CSV
        </a>
      }
    >
      {purchases.length === 0 ? (
        <DashboardEmptyState icon={Users} title="No one has enrolled yet" />
      ) : (
        <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
          <table className="w-full text-left text-sm">
            <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
              <tr>
                <th className={DASHBOARD_TH_CLASS}>Name</th>
                <th className={DASHBOARD_TH_CLASS}>Email</th>
                <th className={DASHBOARD_TH_CLASS}>Purchased</th>
                <th className={DASHBOARD_TH_CLASS}>Payment status</th>
                <th className={DASHBOARD_TH_CLASS}>Progress</th>
                {isAdmin && <th className={DASHBOARD_TH_CLASS}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const completed = completedByUser.get(purchase.userId) ?? 0;
                const percent = totalVideos > 0 ? Math.round((completed / totalVideos) * 100) : 0;
                return (
                  <tr key={purchase.id} className={DASHBOARD_TR_CLASS}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {purchase.user.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${purchase.user.email}`}
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {purchase.user.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {purchase.purchasedAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[purchase.status]}>{purchase.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {purchase.status === "SUCCESS" && totalVideos > 0
                        ? `${percent}% (${completed}/${totalVideos})`
                        : "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
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
    </DashboardShell>
  );
}
