import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Thumbnail } from "@/components/Thumbnail";

// Bundle listings change as bundles are published/purchased, and this page
// has no dynamic APIs (cookies/searchParams) to opt it out of static
// prerendering on its own — force it so builds don't depend on DB access at
// build time (see app/courses/page.tsx for the same pattern).
export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const bundles = await prisma.courseBundle.findMany({
    where: { isPublished: true },
    include: { items: { include: { course: { select: { price: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Course bundles</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">
        Curated learning paths — several courses, one price.
      </p>

      {bundles.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No bundles available yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bundles.map((bundle) => {
            const individualTotal = bundle.items.reduce(
              (sum, item) => sum + Number(item.course.price),
              0
            );
            const savings = individualTotal - Number(bundle.price);

            return (
              <Link
                key={bundle.id}
                href={`/bundles/${bundle.slug}`}
                className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 hover:border-gray-400"
              >
                <Thumbnail url={bundle.thumbnailUrl} alt={bundle.title} icon="🎁" />
                <div className="p-4">
                  <h2 className="font-medium">{bundle.title}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    {bundle.items.length} courses
                  </p>
                  <p className="mt-2 font-semibold">
                    {Number(bundle.price) === 0 ? "Free" : `₹${bundle.price}`}
                  </p>
                  {savings > 0 && (
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Save ₹{savings.toFixed(2)} vs buying separately
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
