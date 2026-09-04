import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Thumbnail } from "@/components/Thumbnail";
import { COURSE_CATEGORY_ICONS } from "@/lib/courseCategories";
import { WishlistButton } from "@/components/courses/WishlistButton";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const entries = await prisma.courseWishlist.findMany({
    where: { userId: session.user.id },
    include: { course: { include: { instructor: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">❤️ My wishlist</h1>

      {entries.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t saved any courses yet.{" "}
          <Link href="/courses" className="underline">
            Browse courses 📚
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(({ course }) => (
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
                <h2 className="truncate font-medium text-slate-900 dark:text-white">
                  {course.title}
                </h2>
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
      )}
    </main>
  );
}
