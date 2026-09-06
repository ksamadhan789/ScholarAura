import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BundleEnrollButton } from "./BundleEnrollButton";

export default async function BundleDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);

  const bundle = await prisma.courseBundle.findUnique({
    where: { slug: params.slug },
    include: {
      items: {
        orderBy: { orderIndex: "asc" },
        include: {
          course: {
            select: { id: true, slug: true, title: true, price: true, category: true },
          },
        },
      },
    },
  });
  if (!bundle || (!bundle.isPublished && session?.user.role !== "ADMIN")) {
    notFound();
  }

  const rates = await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } });
  const serializedRates = rates.map((r) => ({
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  const individualTotal = bundle.items.reduce((sum, item) => sum + Number(item.course.price), 0);
  const savings = individualTotal - Number(bundle.price);

  const courseIds = bundle.items.map((item) => item.course.id);
  const [bundlePurchase, purchases, completions] = session
    ? await Promise.all([
        prisma.bundlePurchase.findUnique({
          where: { userId_bundleId: { userId: session.user.id, bundleId: bundle.id } },
        }),
        prisma.coursePurchase.findMany({
          where: { userId: session.user.id, courseId: { in: courseIds }, status: "SUCCESS" },
          select: { courseId: true },
        }),
        prisma.certificate.findMany({
          where: { userId: session.user.id, courseId: { in: courseIds } },
          select: { courseId: true },
        }),
      ])
    : [null, [], []];

  const alreadyOwned = bundlePurchase?.status === "SUCCESS";
  const ownedCourseIds = new Set(purchases.map((p) => p.courseId));
  const completedCourseIds = new Set(completions.map((c) => c.courseId));
  const completedCount = bundle.items.filter((item) => completedCourseIds.has(item.course.id)).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      {!bundle.isPublished && (
        <p className="mb-4 inline-block rounded bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
          Draft — not visible to the public yet
        </p>
      )}
      <h1 className="text-2xl font-semibold">{bundle.title}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
        {bundle.items.length} courses · Learning path
        {ownedCourseIds.size > 0 ? ` · ${completedCount}/${bundle.items.length} completed` : ""}
      </p>
      <p className="mt-4 text-gray-700 dark:text-slate-300">{bundle.description}</p>

      <div className="mt-4">
        <p className="text-lg font-semibold">
          {Number(bundle.price) === 0 ? "Free" : `₹${bundle.price}`}
          {savings > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400 line-through">
              ₹{individualTotal.toFixed(2)}
            </span>
          )}
        </p>
        {savings > 0 && (
          <p className="text-sm text-green-700 dark:text-green-400">
            Save ₹{savings.toFixed(2)} vs buying separately
          </p>
        )}
      </div>

      <div className="mt-6">
        {!session ? (
          <Link
            href="/login"
            className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white"
          >
            Log in to enroll
          </Link>
        ) : alreadyOwned ? (
          <p className="rounded bg-green-100 dark:bg-green-900/40 px-4 py-2.5 text-sm text-green-800 dark:text-green-300">
            You own this bundle
          </p>
        ) : (
          <BundleEnrollButton
            slug={bundle.slug}
            isPaid={Number(bundle.price) > 0}
            price={Number(bundle.price)}
            rates={serializedRates}
            userName={session.user.name}
            userEmail={session.user.email}
          />
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-medium">Courses in this path</h2>
        <div className="flex flex-col gap-2">
          {bundle.items.map((item, i) => {
            const owned = ownedCourseIds.has(item.course.id);
            const completed = completedCourseIds.has(item.course.id);
            const content = (
              <div>
                <p>
                  {i + 1}. {item.course.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {item.course.category}
                  {owned ? (completed ? " · ✓ Completed" : " · Enrolled") : ""}
                </p>
              </div>
            );

            return owned ? (
              <Link
                key={item.id}
                href={`/courses/${item.course.slug}`}
                className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 hover:border-gray-400"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.id}
                className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-3 text-gray-400"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
