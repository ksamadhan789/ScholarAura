import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCompetitionEntryUploadSession } from "@/lib/competitionEntryFileStorage";
import { ALLOWED_UPLOAD_TYPES_LABEL, MAX_UPLOAD_BYTES, isAllowedUploadType } from "@/lib/uploadValidation";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

  const body = await request.json().catch(() => null);
  const fileName = typeof body?.fileName === "string" ? body.fileName : null;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : null;
  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : null;
  if (!fileName || !mimeType || fileSize == null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isAllowedUploadType(mimeType)) {
    return NextResponse.json(
      { error: `Your entry file must be one of: ${ALLOWED_UPLOAD_TYPES_LABEL}` },
      { status: 400 }
    );
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Your entry file must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` },
      { status: 400 }
    );
  }

  try {
    const uploadUrl = await createCompetitionEntryUploadSession(
      competition.slug,
      session.user.id,
      fileName,
      mimeType
    );
    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error("Failed to start competition entry upload session:", err);
    return NextResponse.json({ error: "Couldn't start the upload. Please try again." }, { status: 500 });
  }
}
