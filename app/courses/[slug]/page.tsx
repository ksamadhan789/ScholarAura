import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EnrollButton } from "./EnrollButton";

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      instructor: { select: { name: true } },
      videos: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!course || (!course.isPublished && session?.user.role !== "ADMIN" && session?.user.id !== course.instructorId)) {
    notFound();
  }

  const [purchase, currentUser, rates] = session
    ? await Promise.all([
        prisma.coursePurchase.findUnique({
          where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
        }),
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } }),
      ])
    : [null, null, await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } })];

  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  const isOwner = session?.user.id === course.instructorId;
  const isAdmin = session?.user.role === "ADMIN";
  const isEnrolled = purchase?.status === "SUCCESS";
  const hasFullAccess = isEnrolled || isOwner || isAdmin;

  const completedVideoIds = session
    ? new Set(
        (
          await prisma.courseProgress.findMany({
            where: {
              userId: session.user.id,
              courseVideoId: { in: course.videos.map((v) => v.id) },
              completedAt: { not: null },
            },
            select: { courseVideoId: true },
          })
        ).map((p) => p.courseVideoId)
      )
    : new Set<string>();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {!course.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
        {course.category} · By {course.instructor.name}
      </p>
      <p className="mt-4 text-gray-700">{course.description}</p>
      <p className="mt-4 text-lg font-semibold">
        {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
      </p>

      <div className="mt-6">
        {!session ? (
          <Link href="/login" className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white">
            Log in to enroll
          </Link>
        ) : isEnrolled ? (
          <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
            You&apos;re enrolled in this course
          </p>
        ) : (
          <>
            {Number(course.price) > 0 && currentUser && Number(currentUser.creditBalance) > 0 && (
              <p className="mb-2 text-sm text-green-700 dark:text-green-400">
                You have ₹{Number(currentUser.creditBalance).toFixed(2)} credit — applied
                automatically when paying in INR.
              </p>
            )}
            <EnrollButton
              slug={course.slug}
              isPaid={Number(course.price) > 0}
              price={Number(course.price)}
              rates={serializedRates}
              userName={session.user.name}
              userEmail={session.user.email}
            />
          </>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-medium">Curriculum</h2>
        {course.videos.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No lectures added yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {course.videos.map((video, i) => {
              const unlocked = hasFullAccess || video.isPreview;
              const completed = completedVideoIds.has(video.id);
              const label = (
                <div>
                  <p>
                    {i + 1}. {video.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {Math.round(video.durationSeconds / 60)} min
                    {video.isPreview && !hasFullAccess ? " · Free preview" : ""}
                    {completed ? " · ✓ Completed" : ""}
                  </p>
                </div>
              );

              return unlocked ? (
                <Link
                  key={video.id}
                  href={`/courses/${course.slug}/lectures/${video.id}`}
                  className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 hover:border-gray-400"
                >
                  {label}
                </Link>
              ) : (
                <div
                  key={video.id}
                  className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 text-gray-400"
                >
                  {label}
                  <span aria-hidden>🔒</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
