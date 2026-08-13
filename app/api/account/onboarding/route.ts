import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userTypes = ["COLLEGE_STUDENT", "PROFESSIONAL"] as const;

const onboardingSchema = z.object({
  skip: z.boolean().optional(),
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
    skip,
    marketingOptIn,
    firstName,
    middleName,
    lastName,
    phone,
    userType,
    fieldOfStudy,
    jobRole,
    expertise,
  } = parsed.data;

  const fullName =
    !skip && firstName && lastName
      ? [firstName, middleName, lastName].filter(Boolean).join(" ")
      : undefined;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingCompletedAt: new Date(),
      consentAcceptedAt: new Date(),
      marketingOptIn: marketingOptIn ?? false,
      ...(!skip && firstName !== undefined && { firstName }),
      ...(!skip && middleName !== undefined && { middleName: middleName || null }),
      ...(!skip && lastName !== undefined && { lastName }),
      ...(fullName !== undefined && { name: fullName }),
      ...(!skip && phone !== undefined && { phone }),
      ...(!skip && userType !== undefined && { userType }),
      ...(!skip && fieldOfStudy !== undefined && { fieldOfStudy: fieldOfStudy || null }),
      ...(!skip && jobRole !== undefined && { jobRole: jobRole || null }),
      ...(!skip && expertise !== undefined && { expertise: expertise || null }),
    },
  });

  return NextResponse.json({ ok: true });
}
