import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userTypes = ["COLLEGE_STUDENT", "PROFESSIONAL"] as const;

const onboardingSchema = z.object({
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Privacy Policy and Terms of Use to continue" }),
  }),
  marketingOptIn: z.boolean().optional(),
  firstName: z.string().trim().min(1, "First name is required").optional(),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Last name is required").optional(),
  phone: z.string().trim().min(6, "Enter a valid mobile number").max(20).optional(),
  userType: z.enum(userTypes).optional(),
  fieldOfStudy: z.string().trim().optional(),
  organization: z.string().trim().max(200).optional(),
  collegeCity: z.string().trim().max(100).optional(),
  collegeState: z.string().trim().max(100).optional(),
  collegeUniversity: z.string().trim().max(200).optional(),
  collegeType: z.string().trim().max(100).optional(),
  jobRole: z.string().trim().optional(),
  expertise: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const {
    marketingOptIn,
    firstName,
    middleName,
    lastName,
    phone,
    userType,
    fieldOfStudy,
    organization,
    collegeCity,
    collegeState,
    collegeUniversity,
    collegeType,
    jobRole,
    expertise,
  } = parsed.data;

  const fullName =
    firstName && lastName
      ? [firstName, middleName, lastName].filter(Boolean).join(" ")
      : undefined;

  let collegeName: string | undefined;
  if (organization) {
    // Case-insensitive so "IIT Bombay" and "iit bombay" are treated as the
    // same college regardless of status — the DB's unique constraint on
    // name is case-sensitive, so without this check here a case-different
    // near-duplicate could otherwise be created successfully.
    const existing = await prisma.college.findFirst({
      where: { name: { equals: organization, mode: "insensitive" } },
    });

    if (existing?.status === "APPROVED") {
      collegeName = existing.name;
    } else if (existing) {
      // PENDING: already awaiting review — attach to it rather than
      // creating a duplicate. REJECTED: give it another chance by
      // re-queuing for review instead of silently reusing a college an
      // admin has no way to ever see again.
      if (existing.status === "REJECTED") {
        await prisma.college.update({ where: { id: existing.id }, data: { status: "PENDING" } });
      }
      collegeName = existing.name;
    } else {
      try {
        const created = await prisma.college.create({
          data: {
            name: organization,
            city: collegeCity || null,
            state: collegeState || null,
            university: collegeUniversity || null,
            collegeType: collegeType || null,
            status: "PENDING",
          },
        });
        collegeName = created.name;
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Another request created the same college name concurrently.
          const raceWinner = await prisma.college.findFirst({
            where: { name: { equals: organization, mode: "insensitive" } },
          });
          collegeName = raceWinner?.name ?? organization;
        } else {
          throw err;
        }
      }
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingCompletedAt: new Date(),
      consentAcceptedAt: new Date(),
      marketingOptIn: marketingOptIn ?? false,
      ...(firstName !== undefined && { firstName }),
      ...(middleName !== undefined && { middleName: middleName || null }),
      ...(lastName !== undefined && { lastName }),
      ...(fullName !== undefined && { name: fullName }),
      ...(phone !== undefined && { phone }),
      ...(userType !== undefined && { userType }),
      ...(fieldOfStudy !== undefined && { fieldOfStudy: fieldOfStudy || null }),
      ...(collegeName !== undefined && { organization: collegeName }),
      ...(jobRole !== undefined && { jobRole: jobRole || null }),
      ...(expertise !== undefined && { expertise: expertise || null }),
    },
  });

  return NextResponse.json({ ok: true });
}
