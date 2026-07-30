import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditCompetitionForm } from "./EditCompetitionForm";

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
        eligibility: competition.eligibility ?? "",
        registrationStartDate: toLocalInput(competition.registrationStartDate),
        resultDate: toLocalInput(competition.resultDate),
      }}
    />
  );
}
