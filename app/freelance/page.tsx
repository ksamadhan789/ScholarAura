import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { StarRating } from "@/components/StarRating";
import { getFreelanceRatingSummaries } from "@/lib/freelanceReview";
import {
  CardGrid,
  EmptyState,
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterGroup,
  FilterOption,
  FilterOptionList,
  FilterPanel,
  ListingHeader,
  ListingShell,
  ResultsSection,
} from "@/components/listing/ListingLayout";

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
  postedByUser: { name: string; photoFileId: string | null };
};

function ListingCard({
  listing,
  rating,
}: {
  listing: Listing;
  rating?: { average: number; count: number };
}) {
  const skills = Array.isArray(listing.skills) ? (listing.skills as string[]) : [];
  return (
    <Link
      href={`/freelance/${listing.slug}`}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={listing.postedByUser.name}
          src={listing.postedByUser.photoFileId ? `/api/freelance/${listing.slug}/photo` : null}
          size={44}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800 dark:text-slate-100">{listing.postedByUser.name}</p>
          {rating ? (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <StarRating value={rating.average} />
              <span className="font-medium text-slate-700 dark:text-slate-200">{rating.average.toFixed(1)}</span>(
              {rating.count})
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">No reviews yet</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <Badge variant="brand">{listing.category}</Badge>
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
        {listing.title}
      </h3>
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 5).map((s) => (
            <span
              key={s}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto pt-4">
        <p className="border-t border-slate-100 pt-3 font-bold text-slate-900 dark:border-slate-700 dark:text-white">
          {listing.rate ?? <span className="font-normal text-slate-500 dark:text-slate-400">Rate on request</span>}
        </p>
      </div>
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
      include: { postedByUser: { select: { name: true, photoFileId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.freelanceListing.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const categories = categoryRows.map((r) => r.category).sort();
  const ratings = await getFreelanceRatingSummaries(listings.map((l) => l.id));

  return (
    <main>
      <ListingHeader
        title="Freelance"
        subtitle="Design, writing, tutoring, development and more — offered directly by students and professionals on ScholarAura."
        action={
          <Link
            href="/dashboard/freelance/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            + Post your services
          </Link>
        }
      />

      <ListingShell
        sidebar={
          <FilterPanel action="/freelance">
            {category && <input type="hidden" name="category" value={category} />}
            <FilterGroup label="Search">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Title, category or skill…"
                className={FILTER_FIELD_CLASS}
              />
            </FilterGroup>
            {categories.length > 0 && (
              <FilterGroup label="Category">
                <FilterOptionList>
                  <FilterOption href="/freelance" active={!category}>
                    All categories
                  </FilterOption>
                  {categories.map((c) => (
                    <FilterOption key={c} href={`/freelance?category=${encodeURIComponent(c)}`} active={category === c}>
                      {c}
                    </FilterOption>
                  ))}
                </FilterOptionList>
              </FilterGroup>
            )}
            <FilterActions clearHref={q || category ? "/freelance" : undefined} />
          </FilterPanel>
        }
      >
        {listings.length === 0 ? (
          <EmptyState
            title={q || category ? "No listings match your search" : "No freelance listings yet"}
            text={q || category ? "Try another search or category." : "Be the first to offer your services."}
          >
            <Link
              href="/dashboard/freelance/new"
              className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Post your services
            </Link>
          </EmptyState>
        ) : (
          <ResultsSection title={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}>
            <CardGrid>
              {listings.map((listing) => (
                <ListingCard key={listing.slug} listing={listing} rating={ratings.get(listing.id)} />
              ))}
            </CardGrid>
          </ResultsSection>
        )}
      </ListingShell>
    </main>
  );
}
