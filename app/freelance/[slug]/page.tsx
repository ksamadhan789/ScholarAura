import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { ContactButton } from "@/components/freelance/ContactButton";

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

  return (
    <main className="mx-auto max-w-[1050px] px-4 py-16">
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

      {!listing.isPublished && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
          ⏸️ This listing is paused — only you can see it right now.
        </p>
      )}

      <h1 className="text-2xl font-semibold">{listing.title}</h1>
      <div className="mt-2 flex items-center gap-2">
        <Avatar
          name={listing.postedByUser.name}
          src={listing.postedByUser.photoFileId ? `/api/freelance/${listing.slug}/photo` : null}
          size={28}
        />
        <p className="text-gray-500 dark:text-slate-400">by {listing.postedByUser.name}</p>
      </div>
      {listing.rate && <p className="mt-2 font-medium">{listing.rate}</p>}

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

      {!isOwner && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ContactButton slug={listing.slug} firstName={listing.postedByUser.name.split(" ")[0]} />
          <a
            href={`mailto:${listing.contactEmail}?subject=${encodeURIComponent(
              `Re: ${listing.title} on ScholarAura`
            )}`}
            className="text-sm text-gray-500 underline hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            or email directly
          </a>
        </div>
      )}
    </main>
  );
}
