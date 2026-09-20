import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";

export const metadata: Metadata = {
  title: "Freelance",
  description: "Freelance services offered by ScholarAura students and professionals.",
};

export const dynamic = "force-dynamic";

type Listing = {
  slug: string;
  title: string;
  category: string;
  rate: string | null;
  skills: unknown;
  postedByUser: { name: string };
};

function ListingCard({ listing }: { listing: Listing }) {
  const skills = Array.isArray(listing.skills) ? (listing.skills as string[]) : [];
  return (
    <Link
      href={`/freelance/${listing.slug}`}
      className="block rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Badge variant="brand">{listing.category}</Badge>
      <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{listing.title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">by {listing.postedByUser.name}</p>
      {listing.rate && (
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{listing.rate}</p>
      )}
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.slice(0, 5).map((s) => (
            <span
              key={s}
              className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default async function FreelancePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const category = searchParams.category;
  const q = searchParams.q?.trim();

  const [listings, categoryRows] = await Promise.all([
    prisma.freelanceListing.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { postedByUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.freelanceListing.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const categories = categoryRows.map((r) => r.category).sort();

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🧰 Freelance</h1>
        <Link
          href="/dashboard/freelance/new"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          + Post your services
        </Link>
      </div>
      <p className="mb-6 text-gray-600 dark:text-slate-400">
        Design, writing, tutoring, dev work and more — offered directly by students and
        professionals on ScholarAura.
      </p>

      <form className="mb-6 flex flex-wrap gap-2" action="/freelance">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by title, category, or skill..."
          className="min-w-[200px] flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        />
        {category && <input type="hidden" name="category" value={category} />}
        <button
          type="submit"
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/freelance"
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              !category
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            ✨ All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/freelance?category=${encodeURIComponent(c)}`}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                category === c
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {listings.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          👀 No freelance listings yet — be the first to post your services!
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
