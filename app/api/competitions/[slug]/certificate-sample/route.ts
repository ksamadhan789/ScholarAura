import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSampleCertificatePdf } from "@/lib/certificateGeneration";
import { sendCertificateSampleEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const competition = await prisma.competition.findUnique({ where: { slug: params.slug } });
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }
  if (!competition.googleSlidesTemplateId) {
    return NextResponse.json({ error: "Set a Google Slides template ID first" }, { status: 400 });
  }

  try {
    const pdfBytes = await generateSampleCertificatePdf({
      googleSlidesTemplateId: competition.googleSlidesTemplateId,
      title: competition.title,
      certificateType: competition.certificateType ?? "PARTICIPATION",
      signatoryName: competition.certificateSignatoryName,
      signatoryTitle: competition.certificateSignatoryTitle,
    });

    const sent = await sendCertificateSampleEmail(
      session.user.email!,
      session.user.name ?? "",
      competition.title,
      pdfBytes
    );
    if (!sent) {
      return NextResponse.json({ error: "Couldn't send the sample email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Failed to generate sample certificate for competition ${competition.slug}:`, err);
    return NextResponse.json(
      { error: "Couldn't generate the sample certificate. Check the template ID and try again." },
      { status: 500 }
    );
  }
}
