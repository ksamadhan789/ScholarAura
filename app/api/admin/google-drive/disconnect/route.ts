import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DRIVE_CONNECTION_ID } from "@/lib/google/delegatedAuth";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.googleDriveConnection.deleteMany({ where: { id: DRIVE_CONNECTION_ID } });
  return NextResponse.json({ ok: true });
}
