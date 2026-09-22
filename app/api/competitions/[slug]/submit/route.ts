import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadCompetitionEntryFile, deleteCompetitionEntryFile } from "@/lib/competitionEntryFileStorage";
import { MAX_UPLOAD_BYTES, matchesMagicBytes } from "@/lib/uploadValidation";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Confirms an entry file the browser already uploaded directly to Drive via
// a session from POST .../submit/upload-session. We don't trust the
// browser's own claims about what it uploaded — download it back and check
// its real size and magic bytes before recording it.
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
  const submissionUrl = typeof body?.submissionUrl === "string" ? body.submissionUrl.trim() : "";
  const submissionNotes = typeof body?.submissionNotes === "string" ? body.submissionNotes.trim() : "";
  const driveFileId = typeof body?.driveFileId === "string" ? body.driveFileId : null;
  const fileName = typeof body?.fileName === "string" ? body.fileName : null;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : null;
  const hasNewFile = !!driveFileId && !!fileName && !!mimeType;

  if (submissionUrl && !isValidUrl(submissionUrl)) {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }
  const willHaveFile = hasNewFile || !!entry.submissionFileId;
  if (!submissionUrl && !willHaveFile) {
    return NextResponse.json(
      { error: "Attach a file or paste a link to your work" },
      { status: 400 }
    );
  }

  let fileFields: {
    submissionFileId: string;
    submissionFileName: string;
    submissionFileContentType: string;
  } | null = null;

  if (hasNewFile) {
    let bytes: Buffer;
    try {
      bytes = await downloadCompetitionEntryFile(driveFileId);
    } catch (err) {
      console.error("Failed to fetch just-uploaded entry file for validation:", err);
      return NextResponse.json({ error: "Couldn't verify the uploaded file. Please try again." }, { status: 500 });
    }
    if (bytes.length > MAX_UPLOAD_BYTES || !matchesMagicBytes(mimeType, bytes)) {
      await deleteCompetitionEntryFile(driveFileId).catch(() => {});
      return NextResponse.json(
        { error: "That file doesn't look valid. Please try another." },
        { status: 400 }
      );
    }
    fileFields = { submissionFileId: driveFileId, submissionFileName: fileName, submissionFileContentType: mimeType };
  }

  const updated = await prisma.competitionEntry.update({
    where: { id: entry.id },
    data: {
      submissionUrl: submissionUrl || null,
      submissionNotes: submissionNotes || null,
      submittedAt: new Date(),
      ...fileFields,
    },
  });

  // Delete the old file from Drive only after the DB row no longer points to it.
  if (hasNewFile && entry.submissionFileId) {
    await deleteCompetitionEntryFile(entry.submissionFileId).catch((err) =>
      console.error(`Failed to delete replaced entry file ${entry.submissionFileId}:`, err)
    );
  }

  return NextResponse.json(updated);
}
