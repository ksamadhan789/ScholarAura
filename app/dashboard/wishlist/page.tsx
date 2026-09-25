import { BookOpen, Briefcase, CalendarDays, Heart, Trophy } from "lucide-react";
import Link from "next/link";
import { DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Thumbnail } from "@/components/Thumbnail";
import { WishlistButton } from "@/components/courses/WishlistButton";
import { SaveButton } from "@/components/SaveButton";
import { formatDateRange } from "@/lib/eventLabels";
import { formatJobDate } from "@/lib/jobLabels";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  const userId = session.user.id;

  const [courseEntries, eventEntries, competitionEntries, jobEntries] = await Promise.all([
    prisma.courseWishlist.findMany({
      where: { userId },
      include: { course: { include: { instructor: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventWishlist.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.competitionWishlist.findMany({
      where: { userId },
      include: { competition: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobWishlist.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isEmpty =
    courseEntries.length === 0 &&
    eventEntries.length === 0 &&
    competitionEntries.length === 0 &&
    jobEntries.length === 0;

  return (
    <DashboardShell
      title="Saved for later"
      description={
        isEmpty
          ? undefined
          : `${courseEntries.length + eventEntries.length + competitionEntries.length + jobEntries.length} saved`
      }
    >
      {isEmpty ? (
        <DashboardEmptyState
          icon={Heart}
          title="Nothing saved yet"
          text="Tap the heart on any course, event, competition or job to keep it here for later."
          href="/courses"
          cta="Start exploring"
        />
      ) : (
        <div className="flex flex-col gap-10">
          {courseEntries.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <BookOpen aria-hidden className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Courses
              </h2>
              <div className="flex flex-col gap-3">
                {courseEntries.map(({ course }) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
                  >
                    <Link href={`/courses/${course.slug}`} className="shrink-0">
                      <div className="h-16 w-24 overflow-hidden rounded-lg">
                        <Thumbnail
                          url={course.thumbnailUrl}
                          alt={course.title}
                          icon={<BookOpen className="h-10 w-10" strokeWidth={1.5} />}
                        />
                      </div>
                    </Link>
                    <Link href={`/courses/${course.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">{course.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {course.category} · By {course.instructor.name}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
                      </p>
                    </Link>
                    <WishlistButton slug={course.slug} isWishlisted />
                  </div>
                ))}
              </div>
            </section>
          )}

          {eventEntries.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <CalendarDays aria-hidden className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Events
              </h2>
              <div className="flex flex-col gap-3">
                {eventEntries.map(({ event }) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
                  >
                    <Link href={`/events/${event.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">{event.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatDateRange(event.startDate, event.endDate)}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {Number(event.fee) === 0 ? "Free" : `₹${event.fee}`}
                      </p>
                    </Link>
                    <SaveButton endpoint={`/api/events/${event.slug}/wishlist`} isSaved />
                  </div>
                ))}
              </div>
            </section>
          )}

          {competitionEntries.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Trophy aria-hidden className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Competitions
              </h2>
              <div className="flex flex-col gap-3">
                {competitionEntries.map(({ competition }) => (
                  <div
                    key={competition.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
                  >
                    <Link href={`/competitions/${competition.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">{competition.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Submit by{" "}
                        {competition.submissionDeadline.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {Number(competition.fee) === 0 ? "Free" : `₹${competition.fee}`}
                      </p>
                    </Link>
                    <SaveButton endpoint={`/api/competitions/${competition.slug}/wishlist`} isSaved />
                  </div>
                ))}
              </div>
            </section>
          )}

          {jobEntries.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                <Briefcase aria-hidden className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Jobs
              </h2>
              <div className="flex flex-col gap-3">
                {jobEntries.map(({ job }) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
                  >
                    <Link href={`/jobs/${job.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">{job.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {job.companyName} · {job.isRemote ? "Remote" : job.location}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Posted {formatJobDate(job.createdAt)}</p>
                    </Link>
                    <SaveButton endpoint={`/api/jobs/${job.slug}/wishlist`} isSaved />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
