import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventPeopleSchema } from "@/lib/eventPeople";

const optionalDate = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.coerce.date().optional()
);

const updateCompetitionSchema = z
  .object({
    isPublished: z.boolean().optional(),
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    submissionDeadline: z.coerce.date().optional(),
    fee: z.coerce.number().min(0).optional(),
    prizeDescription: z.string().trim().nullable().optional(),
    maxTeamSize: z.coerce.number().int().min(1).optional(),
    shortDescription: z.string().trim().nullable().optional(),
    eligibility: z.string().trim().nullable().optional(),
    registrationStartDate: optionalDate.nullable(),
    resultDate: optionalDate.nullable(),
    people: eventPeopleSchema.nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  return NextResponse.json(competition);
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateCompetitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const d = parsed.data;
  const updated = await prisma.competition.update({
    where: { slug: params.slug },
    data: {
      ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
      ...(d.title !== undefined && { title: d.title }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.startDate !== undefined && { startDate: d.startDate }),
      ...(d.endDate !== undefined && { endDate: d.endDate }),
      ...(d.submissionDeadline !== undefined && { submissionDeadline: d.submissionDeadline }),
      ...(d.fee !== undefined && { fee: d.fee }),
      ...(d.prizeDescription !== undefined && { prizeDescription: d.prizeDescription || null }),
      ...(d.maxTeamSize !== undefined && { maxTeamSize: d.maxTeamSize }),
      ...(d.shortDescription !== undefined && { shortDescription: d.shortDescription || null }),
      ...(d.eligibility !== undefined && { eligibility: d.eligibility || null }),
      ...(d.registrationStartDate !== undefined && { registrationStartDate: d.registrationStartDate }),
      ...(d.resultDate !== undefined && { resultDate: d.resultDate }),
      ...(d.people !== undefined && {
        people: d.people && d.people.length > 0 ? d.people : Prisma.JsonNull,
      }),
    },
  });

  return NextResponse.json(updated);
}
