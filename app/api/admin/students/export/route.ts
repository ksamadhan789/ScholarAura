import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  // Neutralize formula injection — a name/organization value that starts with
  // =, +, -, or @ would otherwise be interpreted as a formula by Excel/Sheets
  // when the exported file is opened, letting a malicious profile field run
  // arbitrary formulas (e.g. HYPERLINK/DDE payloads) on whoever opens the CSV.
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

const USER_TYPE_LABELS: Record<string, string> = {
  COLLEGE_STUDENT: "College Student",
  PROFESSIONAL: "Professional",
};

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
      userType: true,
      fieldOfStudy: true,
      jobRole: true,
      consentAcceptedAt: true,
      marketingOptIn: true,
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

  const collegeNames = [...new Set(students.map((s) => s.organization).filter((v): v is string => !!v))];
  const colleges = collegeNames.length
    ? await prisma.college.findMany({
        where: { name: { in: collegeNames, mode: "insensitive" } },
        select: { name: true, city: true, state: true, university: true },
      })
    : [];
  const collegeByName = new Map(colleges.map((c) => [c.name.toLowerCase(), c]));

  const header = [
    "Name",
    "Email",
    "Phone",
    "College",
    "City",
    "State",
    "University",
    "Type",
    "Field / Role",
    "Signed up",
    "Email verified",
    "Signup method",
    "Consent accepted",
    "Marketing opt-in",
    "Enrollments",
    "Credit balance (INR)",
  ];

  const rows = students.map((s) => {
    const college = s.organization ? collegeByName.get(s.organization.toLowerCase()) : undefined;
    return [
    s.name,
    s.email,
    s.phone ?? "",
    s.organization ?? "",
    college?.city ?? "",
    college?.state ?? "",
    college?.university ?? "",
    s.userType ? USER_TYPE_LABELS[s.userType] ?? s.userType : "",
    s.fieldOfStudy ?? s.jobRole ?? "",
    s.createdAt.toISOString(),
    s.emailVerified ? "Yes" : "No",
    s.googleId ? "Google" : "Email/Password",
    s.consentAcceptedAt ? "Yes" : "No",
    s.marketingOptIn ? "Yes" : "No",
    String(s._count.coursePurchases + s._count.eventRegistrations),
    Number(s.creditBalance).toFixed(2),
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scholaraura-students-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
