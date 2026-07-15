import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MyLearningPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const purchases = await prisma.coursePurchase.findMany({
    where: { userId: session.user.id, status: "SUCCESS" },
    include: { course: true },
    orderBy: { purchasedAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">My learning</h1>

      {purchases.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t enrolled in any courses yet.{" "}
          <Link href="/courses" className="underline">
            Browse courses
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {purchases.map(({ course }) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-gray-400"
            >
              <h2 className="font-medium">{course.title}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{course.category}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
