import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendRecruiterAccountApprovedEmail, sendRecruiterAccountRejectedEmail } from "@/lib/email";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().trim().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const { status, rejectionReason } = parsed.data;
  const updated = await prisma.recruiterProfile.update({
    where: { id: params.id },
    data: {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
    },
  });

  if (status === "APPROVED") {
    await sendRecruiterAccountApprovedEmail(recruiter.user.email, recruiter.user.name).catch((err) =>
      console.error("Failed to send recruiter approval email:", err)
    );
  } else {
    await sendRecruiterAccountRejectedEmail(
      recruiter.user.email,
      recruiter.user.name,
      rejectionReason || null
    ).catch((err) => console.error("Failed to send recruiter rejection email:", err));
  }

  return NextResponse.json(updated);
}
