import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCertificatePdfBytes } from "@/lib/certificatePdf";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_");
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const competitionId = searchParams.get("competitionId");
  if (!eventId && !competitionId) {
    return NextResponse.json({ error: "eventId or competitionId is required" }, { status: 400 });
  }

  const [certificates, enrollments] = await Promise.all([
    prisma.certificate.findMany({
      where: {
        status: { in: ["AVAILABLE", "GENERATED"] },
        ...(eventId ? { eventId } : { competitionId }),
      },
      include: { user: true, course: true, event: true, competition: true },
    }),
    eventId
      ? prisma.eventRegistration.findMany({
          where: { eventId },
          select: { userId: true, enrollmentNumber: true },
        })
      : prisma.competitionEntry.findMany({
          where: { competitionId: competitionId! },
          select: { userId: true, enrollmentNumber: true },
        }),
  ]);

  if (certificates.length === 0) {
    return NextResponse.json({ error: "No generated certificates found" }, { status: 404 });
  }

  const enrollmentByUserId = new Map(enrollments.map((e) => [e.userId, e.enrollmentNumber]));

  const zip = new JSZip();
  for (const certificate of certificates) {
    const pdfBytes = await getCertificatePdfBytes(certificate);
    const enrollmentNumber = enrollmentByUserId.get(certificate.userId);
    const filenameBase = sanitizeFilename(
      enrollmentNumber ? `${enrollmentNumber}-${certificate.user.name}` : certificate.certificateNumber
    );
    zip.file(`${filenameBase}.pdf`, pdfBytes);
  }

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  const entityTitle = certificates[0].event?.slug ?? certificates[0].competition?.slug ?? "certificates";

  return new NextResponse(Buffer.from(zipBytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${entityTitle}-certificates.zip"`,
    },
  });
}
