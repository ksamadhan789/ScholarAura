import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getIstYear } from "@/lib/istDate";

/**
 * Runs `attempt` with a freshly generated enrollment number, retrying with a
 * new number if it collides with one assigned by a concurrent request (which
 * generateEnrollmentNumber's plain count-based generation can't itself
 * prevent). If `existingNumber` is already set, reuses it directly with no
 * retry, since it was already committed successfully once.
 */
export async function withEnrollmentNumber<T>(
  existingNumber: string | null | undefined,
  attempt: (enrollmentNumber: string) => Promise<T>
): Promise<T> {
  if (existingNumber) return attempt(existingNumber);

  for (let i = 0; i < 5; i++) {
    const enrollmentNumber = await generateEnrollmentNumber();
    try {
      return await attempt(enrollmentNumber);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        Array.isArray(err.meta?.target) &&
        (err.meta.target as string[]).includes("enrollmentNumber")
      ) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not register after several attempts — enrollment number kept colliding");
}

export async function generateEnrollmentNumber(): Promise<string> {
  const year = getIstYear();

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
