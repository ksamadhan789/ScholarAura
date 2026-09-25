import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConnectedGoogleEmail } from "@/lib/google/delegatedAuth";
import { DriveStatusCard } from "@/components/certificates/DriveStatusCard";
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Coins,
  Flag,
  GraduationCap,
  IndianRupee,
  LifeBuoy,
  Megaphone,
  Percent,
  ReceiptText,
  RotateCcw,
  ScrollText,
  Share2,
  ShieldCheck,
  Tag,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  BANNER_PRIMARY_BUTTON_CLASS,
  DashboardBanner,
  DashboardLinkGroup,
  DashboardStatCard,
} from "@/components/dashboard/DashboardShell";

type QueueItem = { href: string; icon: LucideIcon; label: string; count: number };

/** One review queue: amber with its count when something is waiting, calm when empty. */
function QueueCard({ href, icon: Icon, label, count }: QueueItem) {
  const waiting = count > 0;
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
        waiting
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          waiting
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-slate-100 text-slate-400 dark:bg-slate-700"
        }`}
      >
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span
          className={`block text-xs ${waiting ? "font-semibold text-amber-800 dark:text-amber-300" : "text-slate-400"}`}
        >
          {waiting ? `${count.toLocaleString("en-IN")} waiting` : "All clear"}
        </span>
      </span>
    </Link>
  );
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: { driveConnected?: string; driveError?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const connectedEmail = await getConnectedGoogleEmail();

  const [
    studentCount,
    onboardedCount,
    marketingOptInCount,
    collegeCount,
    pendingCollegeCount,
    publishedCourseCount,
    publishedEventCount,
    publishedCompetitionCount,
    publishedJobCount,
    jobApplicationCount,
    pendingRecruiterCount,
    pendingJobCount,
    pendingRefundRequestCount,
    openSupportTicketCount,
    openFreelanceReportCount,
    courseRevenue,
    eventRevenue,
    competitionRevenue,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", onboardingCompletedAt: { not: null } } }),
    prisma.user.count({ where: { role: "STUDENT", marketingOptIn: true } }),
    prisma.college.count({ where: { status: "APPROVED" } }),
    prisma.college.count({ where: { status: "PENDING" } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.event.count({ where: { isPublished: true } }),
    prisma.competition.count({ where: { isPublished: true } }),
    prisma.job.count({ where: { isPublished: true } }),
    prisma.jobApplication.count(),
    prisma.recruiterProfile.count({ where: { status: "PENDING" } }),
    prisma.job.count({ where: { approvalStatus: "PENDING" } }),
    prisma.refundRequest.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.freelanceReport.count({ where: { status: "OPEN" } }),
    prisma.coursePurchase.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true, creditApplied: true },
    }),
    prisma.eventRegistration.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true, creditApplied: true },
    }),
    prisma.competitionEntry.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true, creditApplied: true },
    }),
  ]);

  // Actual money collected — gross price minus any credit applied. Doesn't
  // include chargedAmount for non-INR payments since that's just the same
  // INR amount billed in a different currency, not additional revenue.
  const totalRevenue =
    Number(courseRevenue._sum.amount ?? 0) -
    Number(courseRevenue._sum.creditApplied ?? 0) +
    Number(eventRevenue._sum.amount ?? 0) -
    Number(eventRevenue._sum.creditApplied ?? 0) +
    Number(competitionRevenue._sum.amount ?? 0) -
    Number(competitionRevenue._sum.creditApplied ?? 0);

  const queues: QueueItem[] = [
    {
      href: "/dashboard/admin/recruiters",
      icon: UserCheck,
      label: "Recruiters to review",
      count: pendingRecruiterCount,
    },
    { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs to review", count: pendingJobCount },
    {
      href: "/dashboard/admin/refund-requests",
      icon: RotateCcw,
      label: "Refund requests",
      count: pendingRefundRequestCount,
    },
    {
      href: "/dashboard/admin/support-tickets",
      icon: LifeBuoy,
      label: "Open support tickets",
      count: openSupportTicketCount,
    },
    {
      href: "/dashboard/admin/freelance-reports",
      icon: Flag,
      label: "Freelance reports",
      count: openFreelanceReportCount,
    },
    { href: "/dashboard/colleges", icon: GraduationCap, label: "Colleges to review", count: pendingCollegeCount },
  ];
  const waitingTotal = queues.reduce((sum, q) => sum + q.count, 0);
  const onboardedPercent = studentCount > 0 ? Math.round((onboardedCount / studentCount) * 100) : 0;

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:py-14">
        <DashboardBanner
          leading={
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sky-300 ring-4 ring-white/5">
              <ShieldCheck aria-hidden className="h-8 w-8" />
            </span>
          }
          eyebrow="Admin"
          title="Admin dashboard"
          subtitle={`Signed in as ${session.user?.email}`}
          actions={
            <Link href="/dashboard/analytics" className={BANNER_PRIMARY_BUTTON_CLASS}>
              <BarChart3 aria-hidden className="h-4 w-4" />
              Analytics
            </Link>
          }
        />

        <div className="mt-6">
          <DriveStatusCard
            connectedEmail={connectedEmail}
            returnTo="/dashboard/admin"
            purpose="used to store certificates, resumes and profile photos."
            missingWarning="certificate generation, resume uploads and profile photo uploads will all fail until one is connected."
            driveConnected={searchParams.driveConnected}
            driveError={searchParams.driveError}
          />
        </div>

        <section className="mt-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Needs your attention</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {waitingTotal > 0 ? `${waitingTotal.toLocaleString("en-IN")} items waiting` : "Nothing waiting"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queues.map((q) => (
              <QueueCard key={q.href} {...q} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">At a glance</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <DashboardStatCard href="/dashboard/students" icon={Users} value={studentCount} label="Students" />
            <DashboardStatCard
              href="/dashboard/analytics"
              icon={IndianRupee}
              value={`₹${totalRevenue.toLocaleString("en-IN")}`}
              label="Total revenue (after credits)"
            />
            <DashboardStatCard
              icon={CheckCircle2}
              value={`${onboardedPercent}%`}
              label={`Onboarded · ${onboardedCount.toLocaleString("en-IN")}`}
            />
            <DashboardStatCard icon={Megaphone} value={marketingOptInCount} label="Opted into marketing" />
            <DashboardStatCard
              href="/dashboard/courses"
              icon={BookOpen}
              value={publishedCourseCount}
              label="Published courses"
            />
            <DashboardStatCard
              href="/dashboard/events"
              icon={CalendarDays}
              value={publishedEventCount}
              label="Published events"
            />
            <DashboardStatCard
              href="/dashboard/competitions"
              icon={Trophy}
              value={publishedCompetitionCount}
              label="Published competitions"
            />
            <DashboardStatCard
              href="/dashboard/jobs"
              icon={Briefcase}
              value={publishedJobCount}
              label={`Published jobs · ${jobApplicationCount.toLocaleString("en-IN")} applications`}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">{collegeCount.toLocaleString("en-IN")} approved colleges.</p>
        </section>

        <section aria-label="Admin tools" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardLinkGroup
            title="Content"
            links={[
              { href: "/dashboard/courses", icon: BookOpen, label: "Courses" },
              { href: "/dashboard/events", icon: CalendarDays, label: "Events" },
              { href: "/dashboard/competitions", icon: Trophy, label: "Competitions" },
              { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs", count: pendingJobCount },
              { href: "/dashboard/external-courses", icon: Award, label: "Recommended courses" },
            ]}
          />
          <DashboardLinkGroup
            title="People"
            links={[
              { href: "/dashboard/students", icon: Users, label: "Students" },
              {
                href: "/dashboard/admin/recruiters",
                icon: UserCheck,
                label: "Recruiters",
                count: pendingRecruiterCount,
              },
              { href: "/dashboard/colleges", icon: GraduationCap, label: "Colleges", count: pendingCollegeCount },
              { href: "/dashboard/affiliates", icon: Share2, label: "Affiliates" },
            ]}
          />
          <DashboardLinkGroup
            title="Money"
            links={[
              {
                href: "/dashboard/admin/refund-requests",
                icon: RotateCcw,
                label: "Refund requests",
                count: pendingRefundRequestCount,
              },
              { href: "/dashboard/coupons", icon: Tag, label: "Coupons" },
              { href: "/dashboard/admin/instructor-commission", icon: Percent, label: "Instructor commission" },
              { href: "/dashboard/currencies", icon: Coins, label: "Currency rates" },
            ]}
          />
          <DashboardLinkGroup
            title="Trust & safety"
            links={[
              {
                href: "/dashboard/admin/support-tickets",
                icon: LifeBuoy,
                label: "Support tickets",
                count: openSupportTicketCount,
              },
              {
                href: "/dashboard/admin/freelance-reports",
                icon: Flag,
                label: "Freelance reports",
                count: openFreelanceReportCount,
              },
              { href: "/dashboard/admin/audit-log", icon: ScrollText, label: "Audit log" },
              { href: "/dashboard/analytics", icon: ReceiptText, label: "Analytics" },
            ]}
          />
        </section>
      </div>
    </main>
  );
}
