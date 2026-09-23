import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadCompetitionEntryFile, deleteCompetitionEntryFile } from "@/lib/competitionEntryFileStorage";
import { downloadBlobBytes, deleteBlob } from "@/lib/blobUpload";
import { sendCompetitionSubmissionReceivedEmail } from "@/lib/email";
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

  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { idCardFileId: true },
  });
  if (!student?.idCardFileId) {
    return NextResponse.json(
      { error: "Upload your student ID card before submitting your entry" },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const submissionUrl = typeof payload.submissionUrl === "string" ? payload.submissionUrl.trim() : "";
  const submissionNotes = typeof payload.submissionNotes === "string" ? payload.submissionNotes.trim() : "";
  const removeFile = payload.removeFile === true;
  const blobUrl = typeof payload.blobUrl === "string" ? payload.blobUrl : null;
  const fileName = typeof payload.fileName === "string" && payload.fileName ? payload.fileName : "entry";
  const mimeType = typeof payload.mimeType === "string" ? payload.mimeType : "";
  const hasNewFile = !!blobUrl;

  if (submissionUrl && !isValidUrl(submissionUrl)) {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }
  const willHaveFile = hasNewFile || (!!entry.submissionFileId && !removeFile);
  if (!willHaveFile) {
    return NextResponse.json(
      { error: "Attach your entry file to submit your entry" },
      { status: 400 }
    );
  }

  let fileFields: {
    submissionFileId: string | null;
    submissionFileName: string | null;
    submissionFileContentType: string | null;
  } | null = null;

  if (hasNewFile) {
    if (!isAllowedUploadType(mimeType)) {
      return NextResponse.json(
        { error: `Your entry file must be one of: ${ALLOWED_UPLOAD_TYPES_LABEL}` },
        { status: 400 }
      );
    }

    let bytes: Buffer;
    try {
      bytes = await downloadBlobBytes(blobUrl);
    } catch (err) {
      console.error("Failed to download staged entry file upload:", err);
      return NextResponse.json(
        { error: "Couldn't read your uploaded file. Please try again." },
        { status: 400 }
      );
    }

    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      await deleteBlob(blobUrl).catch(() => {});
      return NextResponse.json(
        { error: `Your entry file must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }
    if (!matchesMagicBytes(mimeType, bytes)) {
      await deleteBlob(blobUrl).catch(() => {});
      return NextResponse.json(
        { error: "That file doesn't look valid. Please try another." },
        { status: 400 }
      );
    }

    const submissionFileId = await uploadCompetitionEntryFile(
      competition.slug,
      session.user.id,
      fileName,
      bytes,
      mimeType
    );
    fileFields = { submissionFileId, submissionFileName: fileName, submissionFileContentType: mimeType };

    await deleteBlob(blobUrl).catch((err) =>
      console.error(`Failed to delete staged blob ${blobUrl}:`, err)
    );
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

  await sendCompetitionSubmissionReceivedEmail(
    session.user.email!,
    session.user.name ?? "",
    competition.title
  ).catch((err) => console.error("Failed to send competition submission received email:", err));

  return NextResponse.json(updated);
}
