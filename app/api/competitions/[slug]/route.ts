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
    prizeFirst: z.string().trim().nullable().optional(),
    prizeSecond: z.string().trim().nullable().optional(),
    prizeThird: z.string().trim().nullable().optional(),
    maxTeamSize: z.coerce.number().int().min(1).optional(),
    thumbnailUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
    brochureUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
    certificateLogoUrl: z
      .union([z.string().trim().url("Enter a valid URL"), z.literal("")])
      .nullable()
      .optional(),
    shortDescription: z.string().trim().nullable().optional(),
    eligibility: z.string().trim().nullable().optional(),
    registrationStartDate: optionalDate.nullable(),
    registrationDeadline: optionalDate.nullable(),
    resultDate: optionalDate.nullable(),
    people: eventPeopleSchema.nullable(),
    organizer: z.string().trim().nullable().optional(),
    googleFormUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).nullable().optional(),
    googleFormNameEntryId: z.string().trim().nullable().optional(),
    googleFormEmailEntryId: z.string().trim().nullable().optional(),
    googleFormEnrollmentEntryId: z.string().trim().nullable().optional(),
    googleSheetId: z.string().trim().nullable().optional(),
    attendanceRequired: z.boolean().optional(),
    minAttendancePercent: z
      .preprocess(
        (val) => (val === "" || val == null ? null : val),
        z.coerce.number().int().min(0).max(100).nullable()
      )
      .optional(),
    certificateEnabled: z.boolean().optional(),
    certificateType: z.string().trim().nullable().optional(),
    googleSlidesTemplateId: z.string().trim().nullable().optional(),
    certificateSignatoryName: z.string().trim().nullable().optional(),
    certificateSignatoryTitle: z.string().trim().nullable().optional(),
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

  const effectiveAttendanceRequired = d.attendanceRequired ?? competition.attendanceRequired;
  const effectiveMinAttendancePercent =
    d.minAttendancePercent !== undefined ? d.minAttendancePercent : competition.minAttendancePercent;
  if (effectiveAttendanceRequired && effectiveMinAttendancePercent == null) {
    return NextResponse.json(
      { error: "Set a minimum attendance percentage, or turn off the attendance requirement" },
      { status: 400 }
    );
  }

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
      ...(d.prizeFirst !== undefined && { prizeFirst: d.prizeFirst || null }),
      ...(d.prizeSecond !== undefined && { prizeSecond: d.prizeSecond || null }),
      ...(d.prizeThird !== undefined && { prizeThird: d.prizeThird || null }),
      ...(d.maxTeamSize !== undefined && { maxTeamSize: d.maxTeamSize }),
      ...(d.thumbnailUrl !== undefined && { thumbnailUrl: d.thumbnailUrl || null }),
      ...(d.brochureUrl !== undefined && { brochureUrl: d.brochureUrl || null }),
      ...(d.certificateLogoUrl !== undefined && {
        certificateLogoUrl: d.certificateLogoUrl || null,
      }),
      ...(d.shortDescription !== undefined && { shortDescription: d.shortDescription || null }),
      ...(d.eligibility !== undefined && { eligibility: d.eligibility || null }),
      ...(d.registrationStartDate !== undefined && { registrationStartDate: d.registrationStartDate }),
      ...(d.registrationDeadline !== undefined && { registrationDeadline: d.registrationDeadline }),
      ...(d.resultDate !== undefined && { resultDate: d.resultDate }),
      ...(d.people !== undefined && {
        people: d.people && d.people.length > 0 ? d.people : Prisma.JsonNull,
      }),
      ...(d.organizer !== undefined && { organizer: d.organizer || null }),
      ...(d.googleFormUrl !== undefined && { googleFormUrl: d.googleFormUrl || null }),
      ...(d.googleFormNameEntryId !== undefined && {
        googleFormNameEntryId: d.googleFormNameEntryId || null,
      }),
      ...(d.googleFormEmailEntryId !== undefined && {
        googleFormEmailEntryId: d.googleFormEmailEntryId || null,
      }),
      ...(d.googleFormEnrollmentEntryId !== undefined && {
        googleFormEnrollmentEntryId: d.googleFormEnrollmentEntryId || null,
      }),
      ...(d.googleSheetId !== undefined && { googleSheetId: d.googleSheetId || null }),
      ...(d.attendanceRequired !== undefined && { attendanceRequired: d.attendanceRequired }),
      ...(d.minAttendancePercent !== undefined && { minAttendancePercent: d.minAttendancePercent }),
      ...(d.certificateEnabled !== undefined && { certificateEnabled: d.certificateEnabled }),
      ...(d.certificateType !== undefined && { certificateType: d.certificateType || null }),
      ...(d.googleSlidesTemplateId !== undefined && {
        googleSlidesTemplateId: d.googleSlidesTemplateId || null,
      }),
      ...(d.certificateSignatoryName !== undefined && {
        certificateSignatoryName: d.certificateSignatoryName || null,
      }),
      ...(d.certificateSignatoryTitle !== undefined && {
        certificateSignatoryTitle: d.certificateSignatoryTitle || null,
      }),
    },
  });

  return NextResponse.json(updated);
}
