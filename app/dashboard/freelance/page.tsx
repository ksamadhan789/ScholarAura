import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FreelanceListingActions } from "./FreelanceListingActions";

export default async function MyFreelanceListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const listings = await prisma.freelanceListing.findMany({
    where: { postedByUserId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🧰 My freelance listings</h1>
        <Link
          href="/dashboard/freelance/new"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          + New listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t posted any freelance services yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <h2 className="font-medium">{listing.title}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {listing.category} · {listing.isPublished ? "Published" : "Paused"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-1 text-sm">
                  <Link
                    href={`/freelance/${listing.slug}`}
                    className="text-brand-600 underline dark:text-brand-400"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/freelance/${listing.slug}/edit`}
                    className="text-brand-600 underline dark:text-brand-400"
                  >
                    Edit
                  </Link>
                </div>
                <FreelanceListingActions slug={listing.slug} isPublished={listing.isPublished} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
