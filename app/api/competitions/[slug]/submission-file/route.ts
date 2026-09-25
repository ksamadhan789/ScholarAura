import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadCompetitionEntryFile } from "@/lib/competitionEntryFileStorage";
import { contentDisposition } from "@/lib/contentDisposition";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const entry = await prisma.competitionEntry.findUnique({
    where: { userId_competitionId: { userId: session.user.id, competitionId: competition.id } },
  });
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
    return NextResponse.json({ error: "Couldn't fetch your file" }, { status: 500 });
  }
}
