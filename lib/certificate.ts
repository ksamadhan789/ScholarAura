import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.certificate.count({
      where: { certificateNumber: { startsWith: `CERT-${year}-` } },
    });
    const sequence = (count + 1 + attempt).toString().padStart(6, "0");
    const candidate = `CERT-${year}-${sequence}`;

    const existing = await prisma.certificate.findUnique({
      where: { certificateNumber: candidate },
    });
    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique certificate number");
}

export async function issueCourseCertificateIfEligible(userId: string, courseId: string) {
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return existing;

  const totalVideos = await prisma.courseVideo.count({ where: { courseId } });
  if (totalVideos === 0) return null;

  const completedCount = await prisma.courseProgress.count({
    where: { userId, completedAt: { not: null }, courseVideo: { courseId } },
  });
  if (completedCount < totalVideos) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const certificateNumber = await generateCertificateNumber();

    try {
      return await prisma.certificate.create({
        data: {
          userId,
          courseId,
          certificateNumber,
          pdfUrl: `/api/certificates/${certificateNumber}/pdf`,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = err.meta?.target;
        const violatedOwnUniqueness =
          Array.isArray(target) && target.includes("userId") && target.includes("courseId");
        if (violatedOwnUniqueness) {
          // A concurrent request for this same user+course already issued one — return it.
          const own = await prisma.certificate.findUnique({
            where: { userId_courseId: { userId, courseId } },
          });
          if (own) return own;
        }
        // Otherwise the certificateNumber candidate collided with someone else's
        // concurrent issuance — retry with a freshly generated number.
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not issue course certificate after several attempts");
}

export async function issueEventCertificateIfEligible(userId: string, eventId: string) {
  const existing = await prisma.certificate.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (existing) return existing;

  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (!registration || registration.status !== "CONFIRMED") return null;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.endDate > new Date()) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const certificateNumber = await generateCertificateNumber();

    try {
      return await prisma.certificate.create({
        data: {
          userId,
          eventId,
          certificateNumber,
          pdfUrl: `/api/certificates/${certificateNumber}/pdf`,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = err.meta?.target;
        const violatedOwnUniqueness =
          Array.isArray(target) && target.includes("userId") && target.includes("eventId");
        if (violatedOwnUniqueness) {
          // A concurrent request for this same user+event already issued one — return it.
          const own = await prisma.certificate.findUnique({
            where: { userId_eventId: { userId, eventId } },
          });
          if (own) return own;
        }
        // Otherwise the certificateNumber candidate collided with someone else's
        // concurrent issuance — retry with a freshly generated number.
        continue;
      }
      throw err;
    }
  }

  throw new Error("Could not issue event certificate after several attempts");
}
