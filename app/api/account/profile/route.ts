import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional().or(z.literal("")),
  fieldOfStudy: z.string().trim().max(100).optional().or(z.literal("")),
  jobRole: z.string().trim().max(100).optional().or(z.literal("")),
  expertise: z.string().trim().max(200).optional().or(z.literal("")),
  linkedinUrl: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
  bio: z.string().trim().max(500, "Bio must be under 500 characters").optional().or(z.literal("")),
  achievements: z.array(z.string().trim().min(1)).max(10).optional(),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const fullName = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(" ");

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: d.firstName,
      middleName: d.middleName || null,
      lastName: d.lastName,
      name: fullName,
      phone: d.phone || null,
      organization: d.organization || null,
      fieldOfStudy: d.fieldOfStudy || null,
      jobRole: d.jobRole || null,
      expertise: d.expertise || null,
      linkedinUrl: d.linkedinUrl || null,
      bio: d.bio || null,
      achievements: d.achievements && d.achievements.length > 0 ? d.achievements : Prisma.JsonNull,
    },
    select: {
      name: true,
      firstName: true,
      middleName: true,
      lastName: true,
      phone: true,
      organization: true,
      fieldOfStudy: true,
      jobRole: true,
      expertise: true,
      linkedinUrl: true,
      bio: true,
      achievements: true,
    },
  });

  return NextResponse.json(user);
}
