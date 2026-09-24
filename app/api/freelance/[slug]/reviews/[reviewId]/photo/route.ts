import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Public — a freelance review already shows the reviewer's real name on the
// public listing page, so their photo is shown at that same visibility level
// (same rule as course reviews). 404s for a paused listing, matching the page.
export async function GET(
  _request: Request,
  { params }: { params: { slug: string; reviewId: string } }
) {
  const review = await prisma.freelanceReview.findUnique({
    where: { id: params.reviewId },
    include: {
      listing: { select: { slug: true, isPublished: true } },
      reviewer: { select: { photoFileId: true, photoContentType: true } },
    },
  });
  if (!review || review.listing.slug !== params.slug || !review.listing.isPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!review.reviewer.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(review.reviewer.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": review.reviewer.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch freelance reviewer photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
