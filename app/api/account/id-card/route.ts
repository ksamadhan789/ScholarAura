import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadStudentIdCard, deleteStudentIdCard } from "@/lib/studentIdCardStorage";
import { MAX_UPLOAD_BYTES, matchesMagicBytes } from "@/lib/uploadValidation";

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

// Confirms an ID card the browser already uploaded directly to Drive via a
// session from POST /api/account/id-card/upload-session. We don't trust the
// browser's own claims about what it uploaded — download it back and check
// its real size and magic bytes before recording it.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const driveFileId = typeof body?.driveFileId === "string" ? body.driveFileId : null;
  const fileName = typeof body?.fileName === "string" ? body.fileName : null;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : null;
  if (!driveFileId || !fileName || !mimeType) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let bytes: Buffer;
  try {
    bytes = await downloadStudentIdCard(driveFileId);
  } catch (err) {
    console.error("Failed to fetch just-uploaded ID card for validation:", err);
    return NextResponse.json({ error: "Couldn't verify the uploaded file. Please try again." }, { status: 500 });
  }
  if (bytes.length > MAX_UPLOAD_BYTES || !matchesMagicBytes(mimeType, bytes)) {
    await deleteStudentIdCard(driveFileId).catch(() => {});
    return NextResponse.json({ error: "That file doesn't look valid. Please try another." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { idCardFileId: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { idCardFileId: driveFileId, idCardFileName: fileName, idCardContentType: mimeType },
  });

  if (existing?.idCardFileId) {
    await deleteStudentIdCard(existing.idCardFileId).catch((err) =>
      console.error(`Failed to delete replaced ID card ${existing.idCardFileId}:`, err)
    );
  }

  return NextResponse.json({ ok: true, idCardFileName: fileName });
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
