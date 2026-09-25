import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Briefcase,
  CalendarClock,
  CreditCard,
  ExternalLink,
  Globe,
  Hourglass,
  MapPin,
  Pencil,
  Plus,
  Radio,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMPLOYMENT_TYPE_LABELS, closingSoonLabel, formatPostedAgo } from "@/lib/jobLabels";
import { Badge } from "@/components/Badge";
import {
  BANNER_PRIMARY_BUTTON_CLASS,
  BANNER_SECONDARY_BUTTON_CLASS,
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardBanner,
  DashboardEmptyState,
  DashboardStatCard,
} from "@/components/dashboard/DashboardShell";
import { RecruiterJobPublishToggle } from "./RecruiterJobPublishToggle";
import { getRecruiterPlanStatus } from "@/lib/recruiterPlan";

const APPROVAL_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "neutral",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function CompanyTile({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sky-500 text-2xl font-bold text-white ring-4 ring-white/10"
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export default async function RecruiterHomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "RECRUITER") redirect("/dashboard");

  const recruiterProfile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!recruiterProfile) redirect("/dashboard");

  if (recruiterProfile.status !== "APPROVED") {
    const pending = recruiterProfile.status === "PENDING";
    return (
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-[900px] px-4 py-10 sm:py-14">
          <DashboardBanner
            leading={<CompanyTile name={recruiterProfile.companyName} />}
            eyebrow="Recruiter account"
            title={recruiterProfile.companyName}
          />
          <div
            className={`mt-6 flex gap-4 rounded-2xl border p-5 ${
              pending
                ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                pending
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}
            >
              {pending ? <Hourglass aria-hidden className="h-5 w-5" /> : <XCircle aria-hidden className="h-5 w-5" />}
            </span>
            {pending ? (
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Your account is under review</p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  We&rsquo;re reviewing your recruiter account. You&rsquo;ll be able to post jobs once it&rsquo;s
                  approved — we&rsquo;ll email you either way.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200">Your account wasn&rsquo;t approved</p>
                {recruiterProfile.rejectionReason && (
                  <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                    Reason: {recruiterProfile.rejectionReason}
                  </p>
                )}
                <p className="mt-2 text-sm text-red-800 dark:text-red-300">
                  Questions?{" "}
                  <Link href="/contact" className="font-medium underline">
                    Contact us
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { postedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  const jobIds = jobs.map((j) => j.id);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const [applicationCounts, newApplicationCounts, shortlistedCount] = jobIds.length
    ? await Promise.all([
        prisma.jobApplication.groupBy({
          by: ["jobId"],
          where: { jobId: { in: jobIds } },
          _count: { _all: true },
        }),
        prisma.jobApplication.groupBy({
          by: ["jobId"],
          where: { jobId: { in: jobIds }, appliedAt: { gte: weekAgo } },
          _count: { _all: true },
        }),
        prisma.jobApplication.count({
          where: { jobId: { in: jobIds }, status: { in: ["SHORTLISTED", "HIRED"] } },
        }),
      ])
    : [[], [], 0];
  const applicationCountByJobId = new Map(applicationCounts.map((a) => [a.jobId, a._count._all]));
  const newCountByJobId = new Map(newApplicationCounts.map((a) => [a.jobId, a._count._all]));
  const totalApplicants = applicationCounts.reduce((sum, a) => sum + a._count._all, 0);
  const newApplicants = newApplicationCounts.reduce((sum, a) => sum + a._count._all, 0);
  const liveCount = jobs.filter((j) => j.approvalStatus === "APPROVED" && j.isPublished).length;
  const plan = await getRecruiterPlanStatus(session.user.id, now);

  const details = [recruiterProfile.designation, recruiterProfile.companyWebsite?.replace(/^https?:\/\//, "")]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:py-14">
        <DashboardBanner
          leading={<CompanyTile name={recruiterProfile.companyName} />}
          eyebrow="Recruiter dashboard"
          title={recruiterProfile.companyName}
          subtitle={details || undefined}
          actions={
            <>
              <Link href="/jobs" className={BANNER_SECONDARY_BUTTON_CLASS}>
                <Globe aria-hidden className="h-4 w-4" />
                Jobs board
              </Link>
              <Link href="/dashboard/recruiter/jobs/new" className={BANNER_PRIMARY_BUTTON_CLASS}>
                <Plus aria-hidden className="h-4 w-4" />
                Post a job
              </Link>
            </>
          }
        />

        <section aria-label="Hiring activity" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashboardStatCard icon={Radio} value={liveCount} label="Live jobs" />
          <DashboardStatCard icon={Users} value={totalApplicants} label="Total applicants" />
          <DashboardStatCard icon={Sparkles} value={newApplicants} label="New this week" />
          <DashboardStatCard icon={UserCheck} value={shortlistedCount} label="Shortlisted or hired" />
        </section>

        <section
          className={`mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            plan.liveJobCount >= plan.liveJobLimit
              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
              <CreditCard aria-hidden className="h-5 w-5" />
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                {plan.plan === "PRO" ? "Pro plan" : "Free plan"}
              </span>
              {plan.plan === "PRO" && plan.proUntil && (
                <>
                  {" "}
                  until{" "}
                  {plan.proUntil.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Kolkata",
                  })}
                </>
              )}{" "}
              · {plan.liveJobCount} of {plan.liveJobLimit} live jobs used
              {plan.plan === "PRO" && plan.includedBoostsLeft > 0 && <> · 1 free Boost available</>}
              {plan.liveJobCount >= plan.liveJobLimit && (
                <span className="block text-amber-800 dark:text-amber-300">
                  You&apos;re at your limit — pause a job{plan.plan === "FREE" ? " or upgrade" : ""} to post another.
                </span>
              )}
            </p>
          </div>
          <Link href="/dashboard/recruiter/plan" className={`${DASHBOARD_SECONDARY_BUTTON_CLASS} shrink-0`}>
            <Sparkles aria-hidden className="h-4 w-4 text-amber-500" />
            {plan.plan === "PRO" ? "Manage plan" : "Upgrade to Pro"}
          </Link>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Your jobs</h2>
          {jobs.length === 0 ? (
            <DashboardEmptyState
              icon={Briefcase}
              title="Post your first job"
              text="Reach students, graduates and professionals. Each job is reviewed before it goes live."
              href="/dashboard/recruiter/jobs/new"
              cta="Post a job"
            />
          ) : (
            <ul className="space-y-4">
              {jobs.map((job) => {
                const isLive = job.approvalStatus === "APPROVED" && job.isPublished;
                const applicants = applicationCountByJobId.get(job.id) ?? 0;
                const newCount = newCountByJobId.get(job.id) ?? 0;
                const closing = isLive ? closingSoonLabel(job.applicationDeadline, now) : null;
                const statusLabel = isLive
                  ? "Live"
                  : job.approvalStatus === "APPROVED"
                    ? "Not published"
                    : job.approvalStatus === "PENDING"
                      ? "Pending review"
                      : "Changes needed";
                return (
                  <li key={job.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={APPROVAL_BADGE_VARIANT[job.approvalStatus]}>{statusLabel}</Badge>
                          <Badge variant="brand">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
                          {job.featuredUntil && job.featuredUntil > now && <Badge variant="warning">Featured</Badge>}
                          {closing && <Badge variant="warning">{closing}</Badge>}
                        </div>
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="mt-1.5 block font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                        >
                          {job.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin aria-hidden className="h-4 w-4 shrink-0" />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock aria-hidden className="h-4 w-4 shrink-0" />
                            {formatPostedAgo(job.createdAt, now)}
                          </span>
                        </div>
                        {job.approvalStatus === "REJECTED" && job.rejectionReason && (
                          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                            {job.rejectionReason}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/dashboard/recruiter/jobs/${job.slug}/applicants`}
                        className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 lg:min-w-[12rem] dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
                      >
                        <Users aria-hidden className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                        <span>
                          <span className="block text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                            {applicants}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            {applicants === 1 ? "applicant" : "applicants"}
                            {newCount > 0 && (
                              <span className="ml-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                · {newCount} new
                              </span>
                            )}
                          </span>
                        </span>
                      </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                      <Link
                        href={`/dashboard/recruiter/jobs/${job.slug}/applicants`}
                        className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}
                      >
                        View applicants
                      </Link>
                      <Link
                        href={`/dashboard/recruiter/jobs/${job.slug}/edit`}
                        className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                        Edit
                      </Link>
                      {isLive && (
                        <Link
                          href={`/dashboard/recruiter/jobs/${job.slug}/boost`}
                          className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                        >
                          <Sparkles aria-hidden className="h-4 w-4 text-amber-500" />
                          Boost
                        </Link>
                      )}
                      {isLive && (
                        <Link
                          href={`/jobs/${job.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                        >
                          <ExternalLink aria-hidden className="h-4 w-4" />
                          View listing
                        </Link>
                      )}
                      {job.approvalStatus === "APPROVED" && (
                        <span className="ml-auto">
                          <RecruiterJobPublishToggle slug={job.slug} isPublished={job.isPublished} />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
