import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsvResponse } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: event.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { registeredAt: "desc" },
  });

  const header = ["Name", "Email", "Registered", "Payment status"];
  const rows = registrations.map((registration) => [
    registration.user.name,
    registration.user.email,
    registration.registeredAt.toISOString(),
    registration.status,
  ]);

  return toCsvResponse(header, rows, `${event.slug}-registrations-${new Date().toISOString().slice(0, 10)}.csv`);
}
