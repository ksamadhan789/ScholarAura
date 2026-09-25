import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadCompetitionEntryFile } from "@/lib/competitionEntryFileStorage";
import { contentDisposition } from "@/lib/contentDisposition";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string; entryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const entry = await prisma.competitionEntry.findUnique({ where: { id: params.entryId } });
  if (!entry?.submissionFileId) {
    return NextResponse.json({ error: "No file on file" }, { status: 404 });
  }

  try {
    const bytes = await downloadCompetitionEntryFile(entry.submissionFileId);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": entry.submissionFileContentType ?? "application/octet-stream",
        "Content-Disposition": contentDisposition("inline", entry.submissionFileName),
      },
    });
  } catch (err) {
    console.error("Failed to fetch competition entry file:", err);
    return NextResponse.json({ error: "Couldn't fetch the file" }, { status: 500 });
  }
}
