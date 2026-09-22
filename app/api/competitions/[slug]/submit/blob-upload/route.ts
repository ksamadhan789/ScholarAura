import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploadValidation";

// Issues a short-lived client token so the browser can upload an entry file
// straight to Vercel Blob, then POST the resulting blob URL to
// /api/competitions/[slug]/submit to have it validated and forwarded to Drive.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }
  if (new Date() > competition.submissionDeadline) {
    return NextResponse.json({ error: "The submission deadline has passed" }, { status: 400 });
  }

  const entry = await prisma.competitionEntry.findUnique({
    where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
  });
  if (!entry || entry.status !== "SUCCESS") {
    return NextResponse.json({ error: "You haven't entered this competition" }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...ALLOWED_UPLOAD_MIME_TYPES],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("Entry file blob upload token request failed:", err);
    return NextResponse.json(
      { error: "Couldn't start the upload. Please try again." },
      { status: 400 }
    );
  }
}
