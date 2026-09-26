import { getServerSession } from "next-auth";
import { toIstInput } from "@/lib/istDate";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditEventForm } from "./EditEventForm";
import type { EventPerson } from "@/lib/eventPeople";

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
        startDate: toIstInput(event.startDate),
        endDate: toIstInput(event.endDate),
        fee: event.fee.toString(),
        seatsTotal: event.seatsTotal.toString(),
        venueOrLink: event.venueOrLink,
        format: event.format,
        city: event.city ?? "",
        audience: event.audience,
        thumbnailUrl: event.thumbnailUrl ?? "",
        brochureUrl: event.brochureUrl ?? "",
        eligibility: event.eligibility ?? "",
        registrationStartDate: toIstInput(event.registrationStartDate),
        registrationDeadline: toIstInput(event.registrationDeadline),
        resultDate: toIstInput(event.resultDate),
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
