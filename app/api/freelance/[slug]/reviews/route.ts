import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReviewFreelanceListing } from "@/lib/freelanceReview";
import { createNotification } from "@/lib/notify";

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const listing = await prisma.freelanceListing.findUnique({
    where: { slug: params.slug },
    select: { id: true, slug: true, title: true, postedByUserId: true, isPublished: true },
  });
  if (!listing || !listing.isPublished) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!(await canReviewFreelanceListing(listing, session.user.id))) {
    return NextResponse.json(
      { error: "You can review a freelancer once you've messaged them here and they've replied" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.freelanceReview.findUnique({
    where: { listingId_reviewerId: { listingId: listing.id, reviewerId: session.user.id } },
    select: { id: true },
  });

  const review = await prisma.freelanceReview.upsert({
    where: { listingId_reviewerId: { listingId: listing.id, reviewerId: session.user.id } },
    create: {
      listingId: listing.id,
      reviewerId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
  });

  // Only on a brand-new review, not every edit, so the poster isn't pinged
  // repeatedly for the same person tweaking their wording.
  if (!existing) {
    await createNotification({
      userId: listing.postedByUserId,
      type: "FREELANCE_REVIEW",
      title: `New ${parsed.data.rating}★ review on "${listing.title}"`,
      body: parsed.data.comment?.slice(0, 200),
      url: `/freelance/${listing.slug}`,
    }).catch((err) => console.error("Failed to notify freelancer of review:", err));
  }

  return NextResponse.json(review);
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const listing = await prisma.freelanceListing.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.freelanceReview
    .delete({ where: { listingId_reviewerId: { listingId: listing.id, reviewerId: session.user.id } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
