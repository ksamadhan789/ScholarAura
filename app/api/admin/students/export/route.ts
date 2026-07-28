import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      name: true,
      email: true,
      phone: true,
      organization: true,
      createdAt: true,
      emailVerified: true,
      googleId: true,
      creditBalance: true,
      _count: {
        select: {
          coursePurchases: { where: { status: "SUCCESS" } },
          eventRegistrations: { where: { status: "CONFIRMED" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Name",
    "Email",
    "Phone",
    "Organization",
    "Signed up",
    "Email verified",
    "Signup method",
    "Enrollments",
    "Credit balance (INR)",
  ];

  const rows = students.map((s) => [
    s.name,
    s.email,
    s.phone ?? "",
    s.organization ?? "",
    s.createdAt.toISOString(),
    s.emailVerified ? "Yes" : "No",
    s.googleId ? "Google" : "Email/Password",
    String(s._count.coursePurchases + s._count.eventRegistrations),
    Number(s.creditBalance).toFixed(2),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scholaraura-students-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
