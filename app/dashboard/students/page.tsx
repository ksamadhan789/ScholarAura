import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { CheckCircle2, Download, Search, Users } from "lucide-react";
import {
  DASHBOARD_INPUT_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

const USER_TYPE_LABELS: Record<string, string> = {
  COLLEGE_STUDENT: "College Student",
  PROFESSIONAL: "Professional",
};

export default async function StudentsAdminPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const query = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = {
    role: "STUDENT" as const,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [students, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organization: true,
        userType: true,
        fieldOfStudy: true,
        jobRole: true,
        consentAcceptedAt: true,
        marketingOptIn: true,
        createdAt: true,
        emailVerified: true,
        googleId: true,
        creditBalance: true,
        _count: {
          select: {
            coursePurchases: { where: { status: "SUCCESS" } },
            eventRegistrations: { where: { status: "CONFIRMED" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  const collegeNames = [...new Set(students.map((s) => s.organization).filter((v): v is string => !!v))];
  const colleges = collegeNames.length
    ? await prisma.college.findMany({
        where: { name: { in: collegeNames, mode: "insensitive" } },
        select: { name: true, city: true, state: true, university: true },
      })
    : [];
  const collegeByName = new Map(colleges.map((c) => [c.name.toLowerCase(), c]));

  return (
    <DashboardShell
      title="Students"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description={`${totalCount.toLocaleString("en-IN")} student${totalCount === 1 ? "" : "s"}${query ? ` matching "${query}"` : ""}`}
      actions={
        <a
          href={`/api/admin/students/export${query ? `?q=${encodeURIComponent(query)}` : ""}`}
          className={DASHBOARD_SECONDARY_BUTTON_CLASS}
        >
          <Download aria-hidden className="h-4 w-4" />
          Export CSV
        </a>
      }
    >
      <form className="mb-6" role="search">
        <label className="relative block max-w-sm">
          <span className="sr-only">Search students</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or email"
            className={`${DASHBOARD_INPUT_CLASS} pl-9`}
          />
        </label>
      </form>

      {students.length === 0 ? (
        <DashboardEmptyState
          icon={Users}
          title={query ? "No students match that search" : "No students have signed up yet"}
        />
      ) : (
        <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
          <table className="w-full text-left text-sm">
            <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
              <tr>
                <th className={DASHBOARD_TH_CLASS}>Name</th>
                <th className={DASHBOARD_TH_CLASS}>Email</th>
                <th className={DASHBOARD_TH_CLASS}>Phone</th>
                <th className={DASHBOARD_TH_CLASS}>College</th>
                <th className={DASHBOARD_TH_CLASS}>City</th>
                <th className={DASHBOARD_TH_CLASS}>State</th>
                <th className={DASHBOARD_TH_CLASS}>University</th>
                <th className={DASHBOARD_TH_CLASS}>Type</th>
                <th className={DASHBOARD_TH_CLASS}>Field / Role</th>
                <th className={DASHBOARD_TH_CLASS}>Signed up</th>
                <th className={DASHBOARD_TH_CLASS}>Verified</th>
                <th className={DASHBOARD_TH_CLASS}>Method</th>
                <th className={DASHBOARD_TH_CLASS}>Consent</th>
                <th className={DASHBOARD_TH_CLASS}>Marketing</th>
                <th className={DASHBOARD_TH_CLASS}>Enrollments</th>
                <th className={DASHBOARD_TH_CLASS}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const college = student.organization
                  ? collegeByName.get(student.organization.toLowerCase())
                  : undefined;
                return (
                  <tr key={student.id} className={DASHBOARD_TR_CLASS}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {student.name}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`mailto:${student.email}`}
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {student.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{student.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{student.organization ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{college?.city ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{college?.state ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{college?.university ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {student.userType ? (USER_TYPE_LABELS[student.userType] ?? student.userType) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {student.fieldOfStudy ?? student.jobRole ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {student.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <YesNo value={!!student.emailVerified} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {student.googleId ? "Google" : "Email/Password"}
                    </td>
                    <td className="px-4 py-3">
                      <YesNo value={!!student.consentAcceptedAt} />
                    </td>
                    <td className="px-4 py-3">
                      <YesNo value={!!student.marketingOptIn} />
                    </td>
                    <td className="px-4 py-3">{student._count.coursePurchases + student._count.eventRegistrations}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      ₹{Number(student.creditBalance).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} basePath="/dashboard/students" searchParams={{ q: query }} />
    </DashboardShell>
  );
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle2 aria-label="Yes" className="h-4 w-4 text-emerald-500" />
  ) : (
    <span aria-label="No" className="text-slate-300 dark:text-slate-600">
      —
    </span>
  );
}
