import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

const updateSchema = z.object({
  instructorCommissionRatePercent: z.coerce.number().int().min(0).max(100).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
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

  const target = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!target || target.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "That user isn't an instructor" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.userId },
    data: { instructorCommissionRatePercent: parsed.data.instructorCommissionRatePercent },
    select: { id: true, name: true, email: true, instructorCommissionRatePercent: true },
  });

  await logAdminAction({
    actorId: session.user.id,
    action: "INSTRUCTOR_COMMISSION_SET",
    targetType: "User",
    targetId: user.id,
    metadata: { email: user.email, instructorCommissionRatePercent: user.instructorCommissionRatePercent },
  });

  return NextResponse.json(user);
}
