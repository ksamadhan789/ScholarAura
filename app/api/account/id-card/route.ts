import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadStudentIdCard, downloadStudentIdCard, deleteStudentIdCard } from "@/lib/studentIdCardStorage";
import { downloadBlobBytes, deleteBlob } from "@/lib/blobUpload";
import {
  ALLOWED_UPLOAD_TYPES_LABEL,
  MAX_UPLOAD_BYTES,
  isAllowedUploadType,
  matchesMagicBytes,
} from "@/lib/uploadValidation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { idCardFileId: true, idCardFileName: true, idCardContentType: true },
  });
  if (!user?.idCardFileId) {
    return NextResponse.json({ error: "No ID card on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadStudentIdCard(user.idCardFileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": user.idCardContentType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${user.idCardFileName}"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch student ID card:", err);
    return NextResponse.json({ error: "Couldn't fetch your ID card" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const blobUrl = typeof payload?.blobUrl === "string" ? payload.blobUrl : null;
  const fileName = typeof payload?.fileName === "string" && payload.fileName ? payload.fileName : "id-card";
  const mimeType = typeof payload?.mimeType === "string" ? payload.mimeType : "";
  if (!blobUrl) {
    return NextResponse.json({ error: "Please attach your ID card" }, { status: 400 });
  }
  if (!isAllowedUploadType(mimeType)) {
    return NextResponse.json(
      { error: `Your ID card must be one of: ${ALLOWED_UPLOAD_TYPES_LABEL}` },
      { status: 400 }
    );
  }

  let bytes: Buffer;
  try {
    bytes = await downloadBlobBytes(blobUrl);
  } catch (err) {
    console.error("Failed to download staged ID card upload:", err);
    return NextResponse.json({ error: "Couldn't read your uploaded file. Please try again." }, { status: 400 });
  }

  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    await deleteBlob(blobUrl).catch(() => {});
    return NextResponse.json(
      { error: `Your ID card must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` },
      { status: 400 }
    );
  }
  if (!matchesMagicBytes(mimeType, bytes)) {
    await deleteBlob(blobUrl).catch(() => {});
    return NextResponse.json({ error: "That file doesn't look valid. Please try another." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { idCardFileId: true },
  });

  try {
    const idCardFileId = await uploadStudentIdCard(session.user.id, fileName, bytes, mimeType);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { idCardFileId, idCardFileName: fileName, idCardContentType: mimeType },
    });

    await deleteBlob(blobUrl).catch((err) =>
      console.error(`Failed to delete staged blob ${blobUrl}:`, err)
    );

    if (existing?.idCardFileId) {
      await deleteStudentIdCard(existing.idCardFileId).catch((err) =>
        console.error(`Failed to delete replaced ID card ${existing.idCardFileId}:`, err)
      );
    }

    return NextResponse.json({ ok: true, idCardFileName: fileName });
  } catch (err) {
    console.error("Student ID card upload failed:", err);
    return NextResponse.json({ error: "Couldn't upload your ID card. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { idCardFileId: true },
  });
  if (!user?.idCardFileId) {
    return NextResponse.json({ error: "No ID card on file" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { idCardFileId: null, idCardFileName: null, idCardContentType: null },
  });
  await deleteStudentIdCard(user.idCardFileId).catch((err) =>
    console.error(`Failed to delete student ID card ${user.idCardFileId}:`, err)
  );

  return NextResponse.json({ ok: true });
}
