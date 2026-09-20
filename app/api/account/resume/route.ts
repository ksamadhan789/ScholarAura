import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  uploadProfileResume,
  downloadProfileResume,
  deleteProfileResume,
} from "@/lib/profileResumeStorage";

const MAX_RESUME_BYTES = 4 * 1024 * 1024; // stay under Vercel's serverless request body limit
// "%PDF-" — the client-supplied MIME type is just a label the browser attaches
// to whatever the user picked, so it's checked separately against the file's
// actual leading bytes rather than trusted on its own.
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { resumeFileId: true, resumeName: true },
  });
  if (!user?.resumeFileId) {
    return NextResponse.json({ error: "No resume on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadProfileResume(user.resumeFileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${user.resumeName}"`,
      },
    });
  } catch (err) {
    console.error("Failed to fetch profile resume:", err);
    return NextResponse.json({ error: "Couldn't fetch resume" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission" }, { status: 400 });
  }

  const resume = formData.get("resume");
  if (!(resume instanceof File)) {
    return NextResponse.json({ error: "Please attach your resume as a PDF" }, { status: 400 });
  }
  if (resume.type !== "application/pdf") {
    return NextResponse.json({ error: "Resume must be a PDF file" }, { status: 400 });
  }
  if (resume.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Resume must be under 4MB" }, { status: 400 });
  }

  const bytes = new Uint8Array(await resume.arrayBuffer());
  if (!PDF_MAGIC_BYTES.every((byte, i) => bytes[i] === byte)) {
    return NextResponse.json({ error: "That file doesn't look like a valid PDF" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { resumeFileId: true },
  });

  try {
    const fileName = `${session.user.name ?? "resume"} - ${resume.name || "resume.pdf"}`;
    const resumeFileId = await uploadProfileResume(session.user.id, fileName, bytes);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { resumeFileId, resumeName: resume.name || "resume.pdf" },
    });

    if (existing?.resumeFileId) {
      await deleteProfileResume(existing.resumeFileId).catch((err) =>
        console.error(`Failed to delete replaced resume ${existing.resumeFileId}:`, err)
      );
    }

    return NextResponse.json({ ok: true, resumeName: resume.name || "resume.pdf" });
  } catch (err) {
    console.error("Profile resume upload failed:", err);
    return NextResponse.json({ error: "Couldn't upload your resume. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { resumeFileId: true },
  });
  if (!user?.resumeFileId) {
    return NextResponse.json({ error: "No resume on file" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { resumeFileId: null, resumeName: null },
  });
  await deleteProfileResume(user.resumeFileId).catch((err) =>
    console.error(`Failed to delete profile resume ${user.resumeFileId}:`, err)
  );

  return NextResponse.json({ ok: true });
}
