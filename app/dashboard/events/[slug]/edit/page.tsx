import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditEventForm } from "./EditEventForm";
import type { EventPerson } from "@/lib/eventPeople";

function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default async function EditEventPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) notFound();

  return (
    <EditEventForm
      slug={event.slug}
      webhookSecret={event.webhookSecret}
      initial={{
        title: event.title,
        description: event.description,
        shortDescription: event.shortDescription ?? "",
        type: event.type,
        startDate: toLocalInput(event.startDate),
        endDate: toLocalInput(event.endDate),
        fee: event.fee.toString(),
        seatsTotal: event.seatsTotal.toString(),
        venueOrLink: event.venueOrLink,
        isOnline: event.isOnline,
        thumbnailUrl: event.thumbnailUrl ?? "",
        brochureUrl: event.brochureUrl ?? "",
        eligibility: event.eligibility ?? "",
        registrationStartDate: toLocalInput(event.registrationStartDate),
        registrationDeadline: toLocalInput(event.registrationDeadline),
        resultDate: toLocalInput(event.resultDate),
        prizeDescription: event.prizeDescription ?? "",
        prizeFirst: event.prizeFirst ?? "",
        prizeSecond: event.prizeSecond ?? "",
        prizeThird: event.prizeThird ?? "",
        certificateLogoUrl: event.certificateLogoUrl ?? "",
        people: (event.people as unknown as EventPerson[] | null) ?? [],
        organizer: event.organizer ?? "",
        googleFormUrl: event.googleFormUrl ?? "",
        googleFormNameEntryId: event.googleFormNameEntryId ?? "",
        googleFormEmailEntryId: event.googleFormEmailEntryId ?? "",
        googleFormEnrollmentEntryId: event.googleFormEnrollmentEntryId ?? "",
        googleSheetId: event.googleSheetId ?? "",
        attendanceRequired: event.attendanceRequired,
        minAttendancePercent: event.minAttendancePercent?.toString() ?? "",
        certificateEnabled: event.certificateEnabled,
        certificateType: event.certificateType ?? "PARTICIPATION",
        googleSlidesTemplateId: event.googleSlidesTemplateId ?? "",
        certificateSignatoryName: event.certificateSignatoryName ?? "",
        certificateSignatoryTitle: event.certificateSignatoryTitle ?? "",
      }}
    />
  );
}
