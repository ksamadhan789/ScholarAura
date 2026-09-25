import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstructorCommissionRatePercent } from "@/lib/instructorPayout";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardStatCard,
} from "@/components/dashboard/DashboardShell";
import { Award, BarChart3, BookOpen, IndianRupee, Users, Wallet } from "lucide-react";

function netAmount(amount: unknown, creditApplied: unknown): number {
  return Number(amount) - Number(creditApplied);
}

export default async function InstructorAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  const courses = await prisma.course.findMany({
    where: isAdmin ? {} : { instructorId: session.user.id },
    include: {
      videos: { select: { id: true } },
      instructor: { select: { instructorCommissionRatePercent: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Every course here shares the same instructor when viewed as an
  // instructor (not admin), so the rate is uniform — only meaningful to
  // surface as a single "your rate" line in that case.
  const singleInstructorRate =
    !isAdmin && courses.length > 0 ? getInstructorCommissionRatePercent(courses[0].instructor) : null;

  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const totalVideos = course.videos.length;
      const [purchases, certificatesIssued, completions] = await Promise.all([
        prisma.coursePurchase.findMany({
          where: { courseId: course.id, status: "SUCCESS" },
          select: { amount: true, creditApplied: true },
        }),
        prisma.certificate.count({
          where: { courseId: course.id, status: { in: ["AVAILABLE", "GENERATED"] } },
        }),
        totalVideos > 0
          ? prisma.courseProgress.groupBy({
              by: ["userId"],
              where: { completedAt: { not: null }, courseVideo: { courseId: course.id } },
              _count: { _all: true },
              having: { id: { _count: { gte: totalVideos } } },
            })
          : Promise.resolve([]),
      ]);

      const enrollments = purchases.length;
      const revenue = purchases.reduce((sum, p) => sum + netAmount(p.amount, p.creditApplied), 0);
      const completedCount = completions.length;
      const completionRate = enrollments > 0 ? Math.round((completedCount / enrollments) * 100) : 0;
      const commissionRate = getInstructorCommissionRatePercent(course.instructor);
      const netEarnings = Math.round(revenue * (commissionRate / 100) * 100) / 100;

      return {
        course,
        enrollments,
        revenue,
        completedCount,
        completionRate,
        certificatesIssued,
        commissionRate,
        netEarnings,
      };
    }),
  );

  const totalEnrollments = courseStats.reduce((sum, c) => sum + c.enrollments, 0);
  const totalRevenue = courseStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalCertificates = courseStats.reduce((sum, c) => sum + c.certificatesIssued, 0);
  const totalNetEarnings = courseStats.reduce((sum, c) => sum + c.netEarnings, 0);
  const maxRevenue = Math.max(1, ...courseStats.map((c) => c.revenue));

  return (
    <DashboardShell
      title="Course analytics"
      backHref="/dashboard/courses"
      backLabel={isAdmin ? "All courses" : "My courses"}
      description={
        singleInstructorRate != null ? (
          <>
            Net earnings are calculated at your commission rate of <strong>{singleInstructorRate}%</strong> of course
            revenue. This is informational only — it doesn&apos;t represent a payout that has been made.
          </>
        ) : undefined
      }
    >
      {courses.length === 0 ? (
        <DashboardEmptyState
          icon={BarChart3}
          title="No courses yet"
          href="/dashboard/courses/new"
          cta="Create a course"
        />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <DashboardStatCard icon={BookOpen} value={courses.length} label="Courses" />
            <DashboardStatCard icon={Users} value={totalEnrollments} label="Total enrolments" />
            <DashboardStatCard icon={IndianRupee} value={`₹${totalRevenue.toLocaleString("en-IN")}`} label="Revenue" />
            <DashboardStatCard
              icon={Wallet}
              value={`₹${totalNetEarnings.toLocaleString("en-IN")}`}
              label="Net earnings"
            />
            <DashboardStatCard icon={Award} value={totalCertificates} label="Certificates issued" />
          </div>

          <section className={`${DASHBOARD_CARD_CLASS} mb-8 p-5 sm:p-6`}>
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Revenue by course</h2>
            <div className="flex flex-col gap-3">
              {courseStats.map(({ course, revenue }) => (
                <div key={course.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate text-slate-700 sm:w-48 dark:text-slate-200">
                    {course.title}
                  </span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sky-400"
                      style={{ width: `${Math.max((revenue / maxRevenue) * 100, revenue > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                    ₹{revenue.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">By course</h2>
          <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
            <table className="w-full text-left text-sm">
              <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
                <tr>
                  <th className={DASHBOARD_TH_CLASS}>Course</th>
                  <th className={DASHBOARD_TH_CLASS}>Enrollments</th>
                  <th className={DASHBOARD_TH_CLASS}>Revenue</th>
                  <th className={DASHBOARD_TH_CLASS}>Net earnings</th>
                  <th className={DASHBOARD_TH_CLASS}>Completed</th>
                  <th className={DASHBOARD_TH_CLASS}>Certificates</th>
                </tr>
              </thead>
              <tbody>
                {courseStats.map(
                  ({
                    course,
                    enrollments,
                    revenue,
                    completedCount,
                    completionRate,
                    certificatesIssued,
                    commissionRate,
                    netEarnings,
                  }) => (
                    <tr key={course.id} className={DASHBOARD_TR_CLASS}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/courses/${course.slug}/students`}
                          className="font-medium text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                        >
                          {course.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{enrollments}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        ₹{revenue.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        ₹{netEarnings.toLocaleString("en-IN")}
                        {isAdmin && <span className="text-xs"> ({commissionRate}%)</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {completedCount} ({completionRate}%)
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{certificatesIssued}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
