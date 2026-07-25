import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  isPublished: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const course = await prisma.externalCourse.findUnique({ where: { id: params.id } });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.externalCourse.update({
    where: { id: params.id },
    data: { isPublished: parsed.data.isPublished },
  });

  return NextResponse.json(updated);
}
