import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  ExternalLink,
  FileText,
  Gift,
  GraduationCap,
  Heart,
  MessageCircle,
  Pencil,
  PlayCircle,
  Presentation,
  Store,
  Trophy,
  UserRound,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import {
  BANNER_PRIMARY_BUTTON_CLASS,
  BANNER_SECONDARY_BUTTON_CLASS,
  DashboardBanner,
  DashboardStatCard,
} from "@/components/dashboard/DashboardShell";
import { formatDateRange } from "@/lib/eventLabels";
import { firstNameOf, istGreeting, pickContinueLearning, summarizeCourseProgress } from "@/lib/dashboardSummary";

const CARD_CLASS = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800";

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        {linkLabel}
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyState({ icon: Icon, text, href, cta }: { icon: LucideIcon; text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-600">
      <Icon aria-hidden className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
      <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        {cta}
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  );
}

type Shortcut = { href: string; icon: LucideIcon; label: string };

function ShortcutGroup({ title, links }: { title: string; links: Shortcut[] }) {
  return (
    <div className={`${CARD_CLASS} p-5`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
      <ul className="mt-3 space-y-1">
        {links.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-700 dark:text-slate-200 dark:hover:bg-slate-700/50 dark:hover:text-brand-400"
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-600" />
              <span className="flex-1">{label}</span>
              <ArrowRight
                aria-hidden
                className="h-4 w-4 -translate-x-1 text-slate-300 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }
  if (session.user.role === "RECRUITER") {
    redirect("/dashboard/recruiter");
  }

  const userId = session.user.id;
  const isStudent = session.user.role === "STUDENT";
  const isInstructor = session.user.role === "INSTRUCTOR";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      onboardingCompletedAt: true,
      fieldOfStudy: true,
      jobRole: true,
      organization: true,
      photoFileId: true,
      publicProfileEnabled: true,
    },
  });
  if (isStudent && !user?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const now = new Date();
  const [
    purchases,
    upcomingRegistrations,
    upcomingCount,
    registrationCount,
    certificateCount,
    entryCount,
    applicationCount,
  ] = await Promise.all([
    prisma.coursePurchase.findMany({
      where: { userId, status: "SUCCESS" },
      select: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            videos: { select: { id: true }, orderBy: { orderIndex: "asc" } },
          },
        },
      },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.eventRegistration.findMany({
      where: { userId, status: "CONFIRMED", event: { endDate: { gte: now } } },
      select: {
        event: {
          select: {
            id: true,
            slug: true,
            title: true,
            startDate: true,
            endDate: true,
            format: true,
            city: true,
          },
        },
      },
      orderBy: { event: { startDate: "asc" } },
      take: 3,
    }),
    prisma.eventRegistration.count({
      where: { userId, status: "CONFIRMED", event: { endDate: { gte: now } } },
    }),
    prisma.eventRegistration.count({
      where: { userId, status: { in: ["CONFIRMED", "ATTENDED"] } },
    }),
    prisma.certificate.count({
      where: {
        userId,
        status: { in: ["GENERATED", "AVAILABLE"] },
        revokedAt: null,
      },
    }),
    prisma.competitionEntry.count({ where: { userId, status: "SUCCESS" } }),
    prisma.jobApplication.count({ where: { userId } }),
  ]);

  const allVideoIds = purchases.flatMap((p) => p.course.videos.map((v) => v.id));
  const completedProgress =
    allVideoIds.length > 0
      ? await prisma.courseProgress.findMany({
          where: {
            userId,
            courseVideoId: { in: allVideoIds },
            completedAt: { not: null },
          },
          select: { courseVideoId: true },
        })
      : [];
  const completedVideoIds = new Set(completedProgress.map((p) => p.courseVideoId));
  const continueLearning = pickContinueLearning(
    purchases.map((p) => ({
      ...p.course,
      progress: summarizeCourseProgress(p.course.videos, completedVideoIds),
    })),
  );

  const isNewUser =
    isStudent && purchases.length === 0 && registrationCount === 0 && entryCount === 0 && applicationCount === 0;

  const recommendedCourses =
    isNewUser && user?.fieldOfStudy
      ? await prisma.course.findMany({
          where: {
            isPublished: true,
            OR: [
              {
                category: { contains: user.fieldOfStudy, mode: "insensitive" },
              },
              { title: { contains: user.fieldOfStudy, mode: "insensitive" } },
            ],
          },
          select: { slug: true, title: true, category: true },
          take: 3,
        })
      : [];

  const displayName = session.user?.name ?? session.user?.email ?? "there";
  const headline = user?.fieldOfStudy ?? user?.jobRole ?? null;
  const roleLabel = isInstructor ? "Instructor" : "Student";
  const profileDetails = [roleLabel, user?.organization, headline].filter(Boolean).join(" · ");

  const learningLinks: Shortcut[] = [
    { href: "/courses", icon: BookOpen, label: "Browse courses" },
    { href: "/dashboard/learning", icon: GraduationCap, label: "My learning" },
    ...(isInstructor
      ? [
          {
            href: "/dashboard/courses",
            icon: Presentation,
            label: "My courses (instructor)",
          },
        ]
      : []),
    { href: "/dashboard/certificates", icon: Award, label: "My certificates" },
    { href: "/dashboard/wishlist", icon: Heart, label: "Saved for later" },
  ];

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:py-14">
        <DashboardBanner
          leading={
            <span className="rounded-full ring-4 ring-white/10">
              <Avatar name={displayName} src={user?.photoFileId ? "/api/account/photo" : null} size={64} />
            </span>
          }
          eyebrow={istGreeting(now)}
          title={`Welcome back, ${firstNameOf(displayName)}`}
          subtitle={profileDetails}
          actions={
            <>
              {user?.publicProfileEnabled && (
                <Link
                  href={`/portfolio/${userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BANNER_SECONDARY_BUTTON_CLASS}
                >
                  <UserRound aria-hidden className="h-4 w-4" />
                  View profile
                  <ExternalLink aria-hidden className="h-3.5 w-3.5 opacity-70" />
                </Link>
              )}
              {isInstructor && (
                <Link href="/dashboard/courses" className={BANNER_SECONDARY_BUTTON_CLASS}>
                  <Presentation aria-hidden className="h-4 w-4" />
                  My courses
                </Link>
              )}
              <Link href="/dashboard/profile" className={BANNER_PRIMARY_BUTTON_CLASS}>
                <Pencil aria-hidden className="h-4 w-4" />
                Edit profile
              </Link>
            </>
          }
        />

        {/* Stats — the user's own real counts, zeros included */}
        <section aria-label="Your activity" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashboardStatCard
            href="/dashboard/learning"
            icon={GraduationCap}
            value={purchases.length}
            label="Courses enrolled"
          />
          <DashboardStatCard
            href="/dashboard/registrations"
            icon={CalendarDays}
            value={upcomingCount}
            label="Upcoming events"
          />
          <DashboardStatCard
            href="/dashboard/certificates"
            icon={Award}
            value={certificateCount}
            label="Certificates earned"
          />
          <DashboardStatCard
            href="/dashboard/job-applications"
            icon={Briefcase}
            value={applicationCount}
            label="Job applications"
          />
        </section>

        {isNewUser && (
          <section className={`${CARD_CLASS} mt-6 p-6`}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Let&rsquo;s get you started</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You haven&rsquo;t joined anything yet — here&rsquo;s where most people begin.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                {
                  href: "/courses",
                  icon: BookOpen,
                  title: "Take a course",
                  text: "Learn at your own pace",
                },
                {
                  href: "/events",
                  icon: CalendarDays,
                  title: "Join an event",
                  text: "Workshops, webinars and more",
                },
                {
                  href: "/competitions",
                  icon: Trophy,
                  title: "Enter a competition",
                  text: "Test your skills",
                },
              ].map(({ href, icon: Icon, title, text }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{text}</span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                  />
                </Link>
              ))}
            </div>

            {recommendedCourses.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Recommended for {user?.fieldOfStudy}
                </p>
                <ul className="mt-2 space-y-1">
                  {recommendedCourses.map((course) => (
                    <li key={course.slug}>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline dark:text-brand-400"
                      >
                        <BookOpen aria-hidden className="h-4 w-4" />
                        {course.title}
                        <span className="text-slate-400">· {course.category}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {!isNewUser && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <section className={`${CARD_CLASS} p-6 lg:col-span-3`}>
              <SectionHeader title="Continue learning" href="/dashboard/learning" linkLabel="All courses" />
              {continueLearning.length > 0 ? (
                <ul className="space-y-3">
                  {continueLearning.map((course) => (
                    <li
                      key={course.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-700"
                    >
                      <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 sm:flex dark:bg-brand-900/30 dark:text-brand-400">
                        <PlayCircle aria-hidden className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="block font-semibold text-slate-900 hover:text-brand-700 sm:truncate dark:text-white dark:hover:text-brand-400"
                        >
                          {course.title}
                        </Link>
                        <div className="mt-2 flex items-center gap-3">
                          <div
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                            role="progressbar"
                            aria-valuenow={course.progress.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${course.title} progress`}
                          >
                            <div
                              className="h-full rounded-full bg-brand-600"
                              style={{ width: `${course.progress.percent}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {course.progress.completed}/{course.progress.total} lectures
                          </span>
                        </div>
                      </div>
                      {course.progress.nextVideoId && (
                        <Link
                          href={`/courses/${course.slug}/lectures/${course.progress.nextVideoId}`}
                          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                        >
                          {course.progress.actionLabel}
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : purchases.length > 0 ? (
                <EmptyState
                  icon={Award}
                  text="You're all caught up — every course you're enrolled in is complete."
                  href="/courses"
                  cta="Find your next course"
                />
              ) : (
                <EmptyState
                  icon={BookOpen}
                  text="You haven't enrolled in a course yet."
                  href="/courses"
                  cta="Browse courses"
                />
              )}
            </section>

            <section className={`${CARD_CLASS} p-6 lg:col-span-2`}>
              <SectionHeader title="Coming up" href="/dashboard/registrations" linkLabel="My events" />
              {upcomingRegistrations.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingRegistrations.map(({ event }) => {
                    const isLive = event.startDate <= now;
                    return (
                      <li key={event.id}>
                        <Link
                          href={`/events/${event.slug}`}
                          className="group flex gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700"
                        >
                          <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                            <span className="text-[10px] font-semibold uppercase leading-none">
                              {event.startDate.toLocaleDateString("en-IN", {
                                month: "short",
                                timeZone: "Asia/Kolkata",
                              })}
                            </span>
                            <span className="text-lg font-bold leading-tight">
                              {event.startDate.toLocaleDateString("en-IN", {
                                day: "numeric",
                                timeZone: "Asia/Kolkata",
                              })}
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-400">
                              {event.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                              {formatDateRange(event.startDate, event.endDate)}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1.5">
                              {isLive && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                  Happening now
                                </span>
                              )}
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                {event.format === "ONLINE"
                                  ? "Online"
                                  : event.format === "HYBRID"
                                    ? "Hybrid"
                                    : (event.city ?? "In person")}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  text="No upcoming events on your calendar."
                  href="/events"
                  cta="Browse events"
                />
              )}
            </section>
          </div>
        )}

        {/* Shortcuts */}
        <section aria-label="Shortcuts" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ShortcutGroup title="Learning" links={learningLinks} />
          <ShortcutGroup
            title="Events & competitions"
            links={[
              { href: "/events", icon: CalendarDays, label: "Browse events" },
              {
                href: "/dashboard/registrations",
                icon: FileText,
                label: "My events",
              },
              {
                href: "/competitions",
                icon: Trophy,
                label: "Browse competitions",
              },
              {
                href: "/dashboard/entries",
                icon: Award,
                label: "My competitions",
              },
            ]}
          />
          <ShortcutGroup
            title="Jobs"
            links={[
              { href: "/jobs", icon: Briefcase, label: "Browse jobs" },
              {
                href: "/dashboard/job-applications",
                icon: FileText,
                label: "My applications",
              },
              {
                href: "/dashboard/job-alerts",
                icon: Bell,
                label: "Job alerts",
              },
            ]}
          />
          <ShortcutGroup
            title="Freelance & more"
            links={[
              { href: "/freelance", icon: Store, label: "Browse freelance" },
              {
                href: "/dashboard/freelance",
                icon: FileText,
                label: "My listings",
              },
              {
                href: "/dashboard/freelance/messages",
                icon: MessageCircle,
                label: "My messages",
              },
              {
                href: "/dashboard/referrals",
                icon: Gift,
                label: "Refer & earn",
              },
            ]}
          />
        </section>
      </div>
    </main>
  );
}
