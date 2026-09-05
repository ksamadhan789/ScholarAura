import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const college = await prisma.college.findUnique({ where: { id: params.id } });
  if (!college) {
    return NextResponse.json({ error: "College not found" }, { status: 404 });
  }

  const updated = await prisma.college.update({
    where: { id: params.id },
    data: { status },
  });

  await logAdminAction({
    actorId: session.user.id,
    action: status === "APPROVED" ? "COLLEGE_APPROVED" : "COLLEGE_REJECTED",
    targetType: "College",
    targetId: params.id,
    metadata: { name: college.name },
  });

  return NextResponse.json(updated);
}
