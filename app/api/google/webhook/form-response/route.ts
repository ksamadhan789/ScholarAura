import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { computeEligibility } from "@/lib/eligibility";

const webhookSchema = z.object({
  eventSlug: z.string().min(1),
  responseId: z.string().min(1),
  email: z.string().trim().email(),
  enrollmentNumber: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const secret = process.env.GOOGLE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }
  if (request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }
  const { eventSlug, responseId, email, enrollmentNumber } = parsed.data;

  const event = await prisma.event.findUnique({ where: { slug: eventSlug } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // A retried delivery of a response we've already recorded is a no-op, not an error.
  const alreadyRecorded = await prisma.eventRegistration.findUnique({
    where: { googleResponseId: responseId },
  });
  if (alreadyRecorded) {
    return NextResponse.json({ ok: true, alreadyRecorded: true });
  }

  // Match priority: enrollment number (reliable, immune to duplicate names/emails)
  // first, falling back to email — never match on name alone.
  const registration = enrollmentNumber
    ? await prisma.eventRegistration.findFirst({
        where: { eventId: event.id, enrollmentNumber },
      })
    : await prisma.eventRegistration.findFirst({
        where: { eventId: event.id, user: { email } },
      });

  if (!registration) {
    return NextResponse.json(
      { error: "No matching enrollment found for this response" },
      { status: 404 }
    );
  }

  const eligibleForCertificate = computeEligibility(registration, event);

  await prisma.eventRegistration.update({
    where: { id: registration.id },
    data: {
      formSubmitted: true,
      formSubmissionDate: new Date(),
      googleResponseId: responseId,
      eligibleForCertificate,
    },
  });

  return NextResponse.json({ ok: true });
}
