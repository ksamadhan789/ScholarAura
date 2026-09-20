import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadProfilePhoto } from "@/lib/profilePhotoStorage";

// Serves either party's photo within a specific message thread — same
// participant check as the thread itself (the initiator, or the listing's
// owner), and the requested userId must be one of the thread's two real
// participants, not an arbitrary user.
export async function GET(request: Request, { params }: { params: { threadId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const thread = await prisma.freelanceThread.findUnique({
    where: { id: params.threadId },
    include: { listing: true },
  });
  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isInitiator = session.user.id === thread.initiatorId;
  const isOwner = session.user.id === thread.listing.postedByUserId;
  if (!isInitiator && !isOwner) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (userId !== thread.initiatorId && userId !== thread.listing.postedByUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { photoFileId: true, photoContentType: true },
  });
  if (!user?.photoFileId) {
    return NextResponse.json({ error: "No photo on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfilePhoto(user.photoFileId);
    return new NextResponse(bytes, {
      headers: { "Content-Type": user.photoContentType ?? "image/jpeg" },
    });
  } catch (err) {
    console.error("Failed to fetch message sender photo:", err);
    return NextResponse.json({ error: "Couldn't fetch photo" }, { status: 500 });
  }
}
