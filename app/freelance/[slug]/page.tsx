import Link from "next/link";
import { ActionCard, ACTION_PRIMARY_CLASS, DetailColumns } from "@/components/detail/DetailLayout";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { ContactButton } from "@/components/freelance/ContactButton";
import { ReportListingButton } from "@/components/freelance/ReportListingButton";
import { ReviewSection } from "@/components/ReviewSection";
import { StarRating } from "@/components/StarRating";
import { canReviewFreelanceListing } from "@/lib/freelanceReview";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const listing = await prisma.freelanceListing.findUnique({ where: { slug: params.slug } });
  return { title: listing?.title ?? "Freelance listing" };
}

export default async function FreelanceListingPage({
  params,
}: {
  params: { slug: string };
}) {
  const [listing, session] = await Promise.all([
    prisma.freelanceListing.findUnique({
      where: { slug: params.slug },
      include: { postedByUser: { select: { id: true, name: true, photoFileId: true } } },
    }),
    getServerSession(authOptions),
  ]);

  if (!listing || (!listing.isPublished && listing.postedByUserId !== session?.user.id)) {
    notFound();
  }

  const skills = Array.isArray(listing.skills) ? (listing.skills as string[]) : [];
  const isOwner = session?.user.id === listing.postedByUserId;

  const [reviews, reviewAggregate, canReview] = await Promise.all([
    prisma.freelanceReview.findMany({
      where: { listingId: listing.id },
      include: { reviewer: { select: { name: true, photoFileId: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.freelanceReview.aggregate({
      where: { listingId: listing.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    session ? canReviewFreelanceListing(listing, session.user.id) : Promise.resolve(false),
  ]);
  const reviewCount = reviewAggregate._count._all;
  const reviewAverage = reviewAggregate._avg.rating ?? 0;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-10 sm:py-16">
      <div className="mb-4 flex items-center justify-between">
        <Badge variant="brand">{listing.category}</Badge>
        {isOwner && (
          <Link
            href={`/dashboard/freelance/${listing.slug}/edit`}
            className="text-sm text-brand-600 underline dark:text-brand-400"
          >
            Edit listing
          </Link>
        )}
      </div>

      {listing.removedByAdminAt ? (
        <p className="mb-4 text-sm text-red-700 dark:text-red-400">
          This listing was removed by an admin after it was reported — only you can see it. Raise
          a support ticket via Aura if you think this was a mistake.
        </p>
      ) : (
        !listing.isPublished && (
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
            This listing is paused — only you can see it right now.
          </p>
        )
      )}

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{listing.title}</h1>
      <div className="mt-2 flex items-center gap-2">
        <Avatar
          name={listing.postedByUser.name}
          src={listing.postedByUser.photoFileId ? `/api/freelance/${listing.slug}/photo` : null}
          size={28}
        />
        <p className="text-gray-500 dark:text-slate-400">by {listing.postedByUser.name}</p>
        {reviewCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
            · <StarRating value={reviewAverage} />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {reviewAverage.toFixed(1)}
            </span>
            ({reviewCount})
          </span>
        )}
      </div>

      <DetailColumns
        aside={
          <ActionCard
            label="Rate"
            price={
              listing.rate ?? (
                <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">On request</span>
              )
            }
            footer={!isOwner && <ReportListingButton slug={listing.slug} isLoggedIn={!!session} />}
          >
            {isOwner ? (
              <Link href={`/dashboard/freelance/${listing.slug}/edit`} className={ACTION_PRIMARY_CLASS}>
                Edit listing
              </Link>
            ) : (
              <>
                <ContactButton slug={listing.slug} firstName={listing.postedByUser.name.split(" ")[0]} />
                <a
                  href={`mailto:${listing.contactEmail}?subject=${encodeURIComponent(
                    `Re: ${listing.title} on ScholarAura`
                  )}`}
                  className="text-center text-sm text-gray-500 underline hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  or email directly
                </a>
              </>
            )}
          </ActionCard>
        }
      >
        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm text-slate-600 dark:text-slate-300"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 whitespace-pre-wrap text-gray-700 dark:text-slate-300">
          {listing.description}
        </p>

        {listing.portfolioUrl && (
          <a
            href={listing.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-brand-600 underline dark:text-brand-400"
          >
            View portfolio ↗
          </a>
        )}

        <ReviewSection
          apiBase={`/api/freelance/${listing.slug}/reviews`}
          adminDeleteBase="/api/admin/freelance-reviews"
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString(),
            userId: r.reviewerId,
            user: r.reviewer,
          }))}
          average={reviewAverage}
          count={reviewCount}
          canReview={canReview}
          cannotReviewHint={
            isOwner
              ? undefined
              : "Worked with this freelancer? You can leave a review once you've messaged them here and they've replied."
          }
          placeholder="How was working with this freelancer? (optional)"
          currentUserId={session?.user.id ?? null}
          isAdmin={session?.user.role === "ADMIN"}
        />
      </DetailColumns>
    </main>
  );
}
