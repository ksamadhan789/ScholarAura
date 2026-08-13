import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const userTypes = ["SCHOOL_STUDENT", "COLLEGE_STUDENT", "FRESHER", "PROFESSIONAL"] as const;

const onboardingSchema = z.object({
  skip: z.boolean().optional(),
  phone: z.string().trim().min(6, "Enter a valid mobile number").max(20).optional(),
  userType: z.enum(userTypes).optional(),
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

  const { skip, phone, userType } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingCompletedAt: new Date(),
      ...(!skip && phone !== undefined && { phone }),
      ...(!skip && userType !== undefined && { userType }),
    },
  });

  return NextResponse.json({ ok: true });
}
