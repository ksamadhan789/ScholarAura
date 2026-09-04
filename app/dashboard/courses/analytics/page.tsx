import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstructorCommissionRatePercent } from "@/lib/instructorPayout";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 dark:border-slate-700 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

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
    !isAdmin && courses.length > 0
      ? getInstructorCommissionRatePercent(courses[0].instructor)
      : null;

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
    })
  );

  const totalEnrollments = courseStats.reduce((sum, c) => sum + c.enrollments, 0);
  const totalRevenue = courseStats.reduce((sum, c) => sum + c.revenue, 0);
  const totalCertificates = courseStats.reduce((sum, c) => sum + c.certificatesIssued, 0);
  const totalNetEarnings = courseStats.reduce((sum, c) => sum + c.netEarnings, 0);
  const maxRevenue = Math.max(1, ...courseStats.map((c) => c.revenue));

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/dashboard/courses" className="text-sm text-gray-500 hover:underline dark:text-slate-400">
        ← My courses
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-semibold">Course analytics</h1>
      {singleInstructorRate != null && (
        <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
          Your net earnings below are calculated at your commission rate of{" "}
          <strong>{singleInstructorRate}%</strong> of course revenue. This is informational only —
          it doesn&apos;t represent a payout that has been made.
        </p>
      )}

      {courses.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No courses yet.</p>
      ) : (
        <>
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatTile label="Courses" value={courses.length.toLocaleString("en-IN")} />
            <StatTile label="Total enrollments" value={totalEnrollments.toLocaleString("en-IN")} />
            <StatTile label="Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} />
            <StatTile label="Net earnings" value={`₹${totalNetEarnings.toLocaleString("en-IN")}`} />
            <StatTile label="Certificates issued" value={totalCertificates.toLocaleString("en-IN")} />
          </div>

          <h2 className="mb-3 font-semibold">Revenue by course</h2>
          <div className="mb-10 flex flex-col gap-2">
            {courseStats.map(({ course, revenue }) => (
              <div key={course.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate">{course.title}</span>
                <div className="h-3 flex-1 rounded bg-gray-100 dark:bg-slate-800">
                  <div
                    className="h-3 rounded bg-brand-600"
                    style={{ width: `${Math.max((revenue / maxRevenue) * 100, revenue > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-gray-500 dark:text-slate-400">
                  ₹{revenue.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          <h2 className="mb-3 font-semibold">By course</h2>
          <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Course</th>
                  <th className="px-4 py-2.5 font-medium">Enrollments</th>
                  <th className="px-4 py-2.5 font-medium">Revenue</th>
                  <th className="px-4 py-2.5 font-medium">Net earnings</th>
                  <th className="px-4 py-2.5 font-medium">Completed</th>
                  <th className="px-4 py-2.5 font-medium">Certificates</th>
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
                  <tr key={course.id} className="border-t border-gray-200 dark:border-slate-700">
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/courses/${course.slug}/students`} className="hover:underline">
                        {course.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{enrollments}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">₹{revenue.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      ₹{netEarnings.toLocaleString("en-IN")}
                      {isAdmin && <span className="text-xs"> ({commissionRate}%)</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {completedCount} ({completionRate}%)
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{certificatesIssued}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
