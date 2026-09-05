import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendCertificateReadyEmail } from "@/lib/email";
import { getIstYear } from "@/lib/istDate";

async function generateCertificateNumber(): Promise<string> {
  const year = getIstYear();

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
  if (!event.certificateEnabled) return null;
  // Attendance-gated events only issue a certificate once eligibility has
  // been computed (via the Google Sheets sync or a manual attendance import)
  // and cleared the event's configured minimum — events with no attendance
  // requirement keep today's behavior of issuing on confirmed + concluded.
  if (event.attendanceRequired && !registration.eligibleForCertificate) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const certificateNumber = await generateCertificateNumber();

    try {
      const created = await prisma.certificate.create({
        data: {
          userId,
          eventId,
          certificateNumber,
          pdfUrl: `/api/certificates/${certificateNumber}/pdf`,
          certificateType: event.certificateType,
          attendancePercentage: registration.attendancePercent,
          // Events with a Slides template need the async generation pipeline
          // (admin-triggered) to actually produce a file, so they start as
          // ELIGIBLE (pending); events without one keep today's behavior of
          // serving an on-the-fly PDF immediately, so stay GENERATED.
          status: event.googleSlidesTemplateId ? "ELIGIBLE" : "GENERATED",
        },
      });

      // Only notify once a real, downloadable certificate exists — an
      // ELIGIBLE row is just a placeholder pending Slides generation, which
      // sends its own email once that pipeline actually finishes.
      if (created.status === "GENERATED") {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (user) {
          await sendCertificateReadyEmail(user.email, user.name, created.certificateNumber, event.title);
        }
      }

      return created;
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

export async function issueCompetitionCertificateIfEligible(userId: string, competitionId: string) {
  const existing = await prisma.certificate.findUnique({
    where: { userId_competitionId: { userId, competitionId } },
  });
  if (existing) return existing;

  const entry = await prisma.competitionEntry.findUnique({
    where: { userId_competitionId: { userId, competitionId } },
  });
  if (!entry || entry.status !== "SUCCESS") return null;

  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition || competition.endDate > new Date()) return null;
  if (!competition.certificateEnabled) return null;
  if (competition.attendanceRequired && !entry.eligibleForCertificate) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const certificateNumber = await generateCertificateNumber();

    try {
      const created = await prisma.certificate.create({
        data: {
          userId,
          competitionId,
          certificateNumber,
          pdfUrl: `/api/certificates/${certificateNumber}/pdf`,
          certificateType: competition.certificateType,
          attendancePercentage: entry.attendancePercent,
          status: competition.googleSlidesTemplateId ? "ELIGIBLE" : "GENERATED",
        },
      });

      if (created.status === "GENERATED") {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (user) {
          await sendCertificateReadyEmail(user.email, user.name, created.certificateNumber, competition.title);
        }
      }

      return created;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = err.meta?.target;
        const violatedOwnUniqueness =
          Array.isArray(target) && target.includes("userId") && target.includes("competitionId");
        if (violatedOwnUniqueness) {
          // A concurrent request for this same user+competition already issued one — return it.
          const own = await prisma.certificate.findUnique({
            where: { userId_competitionId: { userId, competitionId } },
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

  throw new Error("Could not issue competition certificate after several attempts");
}
