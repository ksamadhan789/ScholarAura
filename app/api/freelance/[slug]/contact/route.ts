import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Finds or creates the (listing, current user) thread and hands back its ID
// so the client can navigate straight to it — reusing an existing thread
// rather than spawning a new one each time someone clicks "Message".
export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const listing = await prisma.freelanceListing.findUnique({ where: { slug: params.slug } });
  if (!listing || !listing.isPublished) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.postedByUserId === session.user.id) {
    return NextResponse.json({ error: "You can't message your own listing" }, { status: 400 });
  }

  const thread = await prisma.freelanceThread.upsert({
    where: { listingId_initiatorId: { listingId: listing.id, initiatorId: session.user.id } },
    update: {},
    create: { listingId: listing.id, initiatorId: session.user.id },
  });

  return NextResponse.json({ threadId: thread.id });
}
