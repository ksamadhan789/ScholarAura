import { getServerSession } from "next-auth";
import { toIstInput } from "@/lib/istDate";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCompetitionForm } from "./EditCompetitionForm";
import type { EventPerson } from "@/lib/eventPeople";

export default async function EditCompetitionPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) notFound();

  return (
    <EditCompetitionForm
      slug={competition.slug}
      initial={{
        title: competition.title,
        description: competition.description,
        shortDescription: competition.shortDescription ?? "",
        startDate: toIstInput(competition.startDate),
        endDate: toIstInput(competition.endDate),
        submissionDeadline: toIstInput(competition.submissionDeadline),
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
        city: competition.city ?? "",
        registrationStartDate: toIstInput(competition.registrationStartDate),
        registrationDeadline: toIstInput(competition.registrationDeadline),
        resultDate: toIstInput(competition.resultDate),
        people: (competition.people as unknown as EventPerson[] | null) ?? [],
        organizer: competition.organizer ?? "",
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
