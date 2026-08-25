import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCompetitionForm } from "./EditCompetitionForm";
import type { EventPerson } from "@/lib/eventPeople";

function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default async function EditCompetitionPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) notFound();

  return (
    <EditCompetitionForm
      slug={competition.slug}
      webhookSecret={competition.webhookSecret}
      initial={{
        title: competition.title,
        description: competition.description,
        shortDescription: competition.shortDescription ?? "",
        startDate: toLocalInput(competition.startDate),
        endDate: toLocalInput(competition.endDate),
        submissionDeadline: toLocalInput(competition.submissionDeadline),
        fee: competition.fee.toString(),
        prizeDescription: competition.prizeDescription ?? "",
        prizeFirst: competition.prizeFirst ?? "",
        prizeSecond: competition.prizeSecond ?? "",
        prizeThird: competition.prizeThird ?? "",
        maxTeamSize: competition.maxTeamSize.toString(),
        thumbnailUrl: competition.thumbnailUrl ?? "",
        brochureUrl: competition.brochureUrl ?? "",
        certificateLogoUrl: competition.certificateLogoUrl ?? "",
        eligibility: competition.eligibility ?? "",
        registrationStartDate: toLocalInput(competition.registrationStartDate),
        registrationDeadline: toLocalInput(competition.registrationDeadline),
        resultDate: toLocalInput(competition.resultDate),
        people: (competition.people as unknown as EventPerson[] | null) ?? [],
        organizer: competition.organizer ?? "",
        googleFormUrl: competition.googleFormUrl ?? "",
        googleFormNameEntryId: competition.googleFormNameEntryId ?? "",
        googleFormEmailEntryId: competition.googleFormEmailEntryId ?? "",
        googleFormEnrollmentEntryId: competition.googleFormEnrollmentEntryId ?? "",
        googleSheetId: competition.googleSheetId ?? "",
        attendanceRequired: competition.attendanceRequired,
        minAttendancePercent: competition.minAttendancePercent?.toString() ?? "",
        certificateEnabled: competition.certificateEnabled,
        certificateType: competition.certificateType ?? "PARTICIPATION",
        googleSlidesTemplateId: competition.googleSlidesTemplateId ?? "",
        certificateSignatoryName: competition.certificateSignatoryName ?? "",
        certificateSignatoryTitle: competition.certificateSignatoryTitle ?? "",
      }}
    />
  );
}
