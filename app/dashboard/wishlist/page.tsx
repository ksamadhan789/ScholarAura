import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Thumbnail } from "@/components/Thumbnail";
import { COURSE_CATEGORY_ICONS } from "@/lib/courseCategories";
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
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">❤️ Saved for later</h1>

      {isEmpty ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t saved anything yet. Look for the 🤍 button on courses, events,
          competitions, and jobs.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {courseEntries.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                📚 Courses
              </h2>
              <div className="flex flex-col gap-3">
                {courseEntries.map(({ course }) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-4 rounded border border-gray-200 dark:border-slate-700 p-3"
                  >
                    <Link href={`/courses/${course.slug}`} className="shrink-0">
                      <div className="h-16 w-24 overflow-hidden rounded">
                        <Thumbnail
                          url={course.thumbnailUrl}
                          alt={course.title}
                          icon={COURSE_CATEGORY_ICONS[course.category] ?? "📘"}
                        />
                      </div>
                    </Link>
                    <Link href={`/courses/${course.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
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
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                📅 Events
              </h2>
              <div className="flex flex-col gap-3">
                {eventEntries.map(({ event }) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 rounded border border-gray-200 dark:border-slate-700 p-3"
                  >
                    <Link href={`/events/${event.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
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
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                🏆 Competitions
              </h2>
              <div className="flex flex-col gap-3">
                {competitionEntries.map(({ competition }) => (
                  <div
                    key={competition.id}
                    className="flex items-center gap-4 rounded border border-gray-200 dark:border-slate-700 p-3"
                  >
                    <Link href={`/competitions/${competition.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">
                        {competition.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
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
                    <SaveButton
                      endpoint={`/api/competitions/${competition.slug}/wishlist`}
                      isSaved
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {jobEntries.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                💼 Jobs
              </h2>
              <div className="flex flex-col gap-3">
                {jobEntries.map(({ job }) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 rounded border border-gray-200 dark:border-slate-700 p-3"
                  >
                    <Link href={`/jobs/${job.slug}`} className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-slate-900 dark:text-white">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {job.companyName} · {job.isRemote ? "Remote" : job.location}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                        Posted {formatJobDate(job.createdAt)}
                      </p>
                    </Link>
                    <SaveButton endpoint={`/api/jobs/${job.slug}/wishlist`} isSaved />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
