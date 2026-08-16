import { prisma } from "@/lib/prisma";

export async function generateEnrollmentNumber(): Promise<string> {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.eventRegistration.count({
      where: { enrollmentNumber: { startsWith: `ENR-${year}-` } },
    });
    const sequence = (count + 1 + attempt).toString().padStart(6, "0");
    const candidate = `ENR-${year}-${sequence}`;

    const existing = await prisma.eventRegistration.findUnique({
      where: { enrollmentNumber: candidate },
    });
    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique enrollment number");
}

export function buildGoogleFormUrl(
  event: {
    googleFormUrl: string | null;
    googleFormNameEntryId: string | null;
    googleFormEmailEntryId: string | null;
    googleFormEnrollmentEntryId: string | null;
  },
  participant: { name: string; email: string; enrollmentNumber: string }
): string | null {
  if (!event.googleFormUrl) return null;

  const url = new URL(event.googleFormUrl);
  url.searchParams.set("usp", "pp_url");
  if (event.googleFormNameEntryId) {
    url.searchParams.set(event.googleFormNameEntryId, participant.name);
  }
  if (event.googleFormEmailEntryId) {
    url.searchParams.set(event.googleFormEmailEntryId, participant.email);
  }
  if (event.googleFormEnrollmentEntryId) {
    url.searchParams.set(event.googleFormEnrollmentEntryId, participant.enrollmentNumber);
  }
  return url.toString();
}
