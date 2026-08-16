import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildGoogleFormUrl } from "@/lib/enrollment";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId: session.user.id, eventId: event.id } },
  });
  if (!registration) {
    return NextResponse.json({ registered: false });
  }

  const googleFormUrl =
    registration.status === "CONFIRMED" && registration.enrollmentNumber
      ? buildGoogleFormUrl(event, {
          name: registration.certificateName ?? session.user.name ?? "",
          email: session.user.email ?? "",
          enrollmentNumber: registration.enrollmentNumber,
        })
      : null;

  return NextResponse.json({
    registered: true,
    status: registration.status,
    enrollmentNumber: registration.enrollmentNumber,
    formSubmitted: registration.formSubmitted,
    formSubmissionDate: registration.formSubmissionDate,
    attendancePercent: registration.attendancePercent,
    eligibleForCertificate: registration.eligibleForCertificate,
    googleFormUrl,
  });
}
