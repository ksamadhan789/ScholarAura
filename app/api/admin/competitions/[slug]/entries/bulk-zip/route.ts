import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadCompetitionEntryFile } from "@/lib/competitionEntryFileStorage";
import { mapWithConcurrency } from "@/lib/concurrency";

// Drive downloads are I/O-bound — running a handful at once instead of one
// at a time cuts wall-clock time enough to matter for a serverless
// function's execution time limit, without opening so many simultaneous
// Drive API calls that they start getting rate limited.
const DOWNLOAD_CONCURRENCY = 5;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_");
}

function fileExtension(fileName: string | null): string {
  if (!fileName) return "";
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex);
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const entries = await prisma.competitionEntry.findMany({
    where: { competitionId: competition.id, submissionFileId: { not: null } },
    select: {
      submissionFileId: true,
      submissionFileName: true,
      enrollmentNumber: true,
      user: { select: { name: true } },
    },
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "No submitted entry files found" }, { status: 404 });
  }

  const filesByEntry = await mapWithConcurrency(entries, DOWNLOAD_CONCURRENCY, async (entry) => ({
    entry,
    bytes: await downloadCompetitionEntryFile(entry.submissionFileId!),
  }));

  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const { entry, bytes } of filesByEntry) {
    const extension = fileExtension(entry.submissionFileName);
    const base = sanitizeFilename(
      entry.enrollmentNumber ? `${entry.enrollmentNumber}-${entry.user.name}` : entry.user.name
    );

    // Guard against two entries sanitizing to the same base name (e.g. two
    // students with the same name and no enrollment number) silently
    // overwriting each other inside the zip.
    let filename = `${base}${extension}`;
    let suffix = 2;
    while (usedNames.has(filename)) {
      filename = `${base}-${suffix}${extension}`;
      suffix += 1;
    }
    usedNames.add(filename);
    zip.file(filename, bytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });

  return new NextResponse(Buffer.from(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${competition.slug}-entry-files.zip"`,
    },
  });
}
