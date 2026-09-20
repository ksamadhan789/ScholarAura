import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Public — a freelance listing already shows the poster's real name to any
// visitor (unmoderated public marketplace), so their photo is shown at the
// same visibility level as the listing itself, same gate as the page:
// published, or the listing's own owner viewing their own paused listing.
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const listing = await prisma.freelanceListing.findUnique({
    where: { slug: params.slug },
    include: { postedByUser: { select: { photoFileId: true, photoContentType: true } } },
  });
  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!listing.isPublished) {
    const session = await getServerSession(authOptions);
    if (session?.user.id !== listing.postedByUserId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  if (!listing.postedByUser.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(listing.postedByUser.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": listing.postedByUser.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch freelance poster photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
