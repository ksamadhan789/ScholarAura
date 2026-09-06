import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { BundleDeleteButton } from "./BundleDeleteButton";

export default async function BundlesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const bundles = await prisma.courseBundle.findMany({
    include: { _count: { select: { items: true, purchases: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Course bundles</h1>
        <Link
          href="/dashboard/bundles/new"
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white"
        >
          + New bundle
        </Link>
      </div>

      {bundles.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500 dark:text-slate-400">No bundles created yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Courses</th>
                <th className="px-4 py-2.5 font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Purchases</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => (
                <tr key={bundle.id} className="border-t border-gray-200 dark:border-slate-700">
                  <td className="px-4 py-2.5">{bundle.title}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{bundle._count.items}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {Number(bundle.price) === 0 ? "Free" : `₹${bundle.price}`}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{bundle._count.purchases}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={bundle.isPublished ? "success" : "neutral"}>
                      {bundle.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/bundles/${bundle.slug}/edit`}
                        className="rounded border border-gray-300 dark:border-slate-600 px-2.5 py-1 text-xs"
                      >
                        Edit
                      </Link>
                      {bundle._count.purchases === 0 && (
                        <BundleDeleteButton slug={bundle.slug} title={bundle.title} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
