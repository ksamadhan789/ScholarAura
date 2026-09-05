import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsvResponse } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({ where: { slug: params.slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (session.user.role !== "ADMIN" && session.user.id !== job.postedByUserId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const applications = await prisma.jobApplication.findMany({
    where: { jobId: job.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { appliedAt: "desc" },
  });

  const header = ["Name", "Email", "Applied", "Status", "Cover note"];
  const rows = applications.map((application) => [
    application.user.name,
    application.user.email,
    application.appliedAt.toISOString(),
    application.status,
    application.coverNote ?? "",
  ]);

  return toCsvResponse(header, rows, `${job.slug}-applicants-${new Date().toISOString().slice(0, 10)}.csv`);
}
