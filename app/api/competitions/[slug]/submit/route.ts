import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCompetitionEntryFile, deleteCompetitionEntryFile } from "@/lib/competitionEntryFileStorage";
import {
  ALLOWED_UPLOAD_TYPES_LABEL,
  MAX_UPLOAD_BYTES,
  isAllowedUploadType,
  matchesMagicBytes,
} from "@/lib/uploadValidation";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

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

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const submissionUrlRaw = formData.get("submissionUrl");
  const submissionNotesRaw = formData.get("submissionNotes");
  const removeFile = formData.get("removeFile") === "true";
  const file = formData.get("entryFile");

  const submissionUrl = typeof submissionUrlRaw === "string" ? submissionUrlRaw.trim() : "";
  const submissionNotes = typeof submissionNotesRaw === "string" ? submissionNotesRaw.trim() : "";
  const hasNewFile = file instanceof File && file.size > 0;

  if (submissionUrl && !isValidUrl(submissionUrl)) {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }
  const willHaveFile = hasNewFile || (!!entry.submissionFileId && !removeFile);
  if (!submissionUrl && !willHaveFile) {
    return NextResponse.json(
      { error: "Attach a file or paste a link to your work" },
      { status: 400 }
    );
  }

  let fileFields: {
    submissionFileId: string | null;
    submissionFileName: string | null;
    submissionFileContentType: string | null;
  } | null = null;

  if (hasNewFile) {
    if (!isAllowedUploadType(file.type)) {
      return NextResponse.json(
        { error: `Your entry file must be one of: ${ALLOWED_UPLOAD_TYPES_LABEL}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Your entry file must be under 4MB" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesMagicBytes(file.type, bytes)) {
      return NextResponse.json(
        { error: "That file doesn't look valid. Please try another." },
        { status: 400 }
      );
    }

    const fileName = file.name || "entry";
    const submissionFileId = await uploadCompetitionEntryFile(
      competition.slug,
      session.user.id,
      fileName,
      bytes,
      file.type
    );
    fileFields = { submissionFileId, submissionFileName: fileName, submissionFileContentType: file.type };
  } else if (removeFile) {
    fileFields = { submissionFileId: null, submissionFileName: null, submissionFileContentType: null };
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
  if ((hasNewFile || removeFile) && entry.submissionFileId) {
    await deleteCompetitionEntryFile(entry.submissionFileId).catch((err) =>
      console.error(`Failed to delete replaced entry file ${entry.submissionFileId}:`, err)
    );
  }

  return NextResponse.json(updated);
}
