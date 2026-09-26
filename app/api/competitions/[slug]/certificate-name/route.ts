import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";
import {
  CERTIFICATE_NAME_LOCKED_MESSAGE,
  certificateNameBodySchema,
  isCertificateNameLocked,
} from "@/lib/certificateName";

// Changes the name printed on a competition certificate — the entrant's own
// until the certificate is made, or anyone's for an admin.
export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const parsed = certificateNameBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid name" }, { status: 400 });
  }
  const { name, userId } = parsed.data;
  const isAdmin = session.user.role === "ADMIN";
  if (userId && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const targetUserId = userId ?? session.user.id;

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const entry = await prisma.competitionEntry.findUnique({
    where: { userId_competitionId: { userId: targetUserId, competitionId: competition.id } },
  });
  if (!entry || entry.status !== "SUCCESS") {
    return NextResponse.json({ error: "No entry found for this competition" }, { status: 404 });
  }

  if (!isAdmin) {
    const certificate = await prisma.certificate.findUnique({
      where: { userId_competitionId: { userId: targetUserId, competitionId: competition.id } },
      select: { status: true },
    });
    if (isCertificateNameLocked(certificate?.status)) {
      return NextResponse.json({ error: CERTIFICATE_NAME_LOCKED_MESSAGE }, { status: 409 });
    }
  }

  await prisma.competitionEntry.update({ where: { id: entry.id }, data: { certificateName: name } });

  if (userId) {
    await logAdminAction({
      actorId: session.user.id,
      action: "CERTIFICATE_NAME_CHANGED",
      targetType: "CompetitionEntry",
      targetId: entry.id,
      metadata: { from: entry.certificateName, to: name },
    });
  }

  return NextResponse.json({ certificateName: name });
}
