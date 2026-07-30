import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { issueEventCertificateIfEligible } from "@/lib/certificate";

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id, status: "CONFIRMED" },
    include: { event: true },
    orderBy: { event: { startDate: "asc" } },
  });

  // Concluded events auto-issue a certificate the next time the student visits this page.
  // allSettled so one certificate-issuance failure can't take down the whole page.
  const issuanceResults = await Promise.allSettled(
    registrations
      .filter((r) => r.event.endDate < new Date())
      .map((r) => issueEventCertificateIfEligible(session.user.id, r.eventId))
  );
  for (const result of issuanceResults) {
    if (result.status === "rejected") {
      console.error("Certificate issuance failed:", result.reason);
    }
  }

  const certificates = await prisma.certificate.findMany({
    where: {
      userId: session.user.id,
      eventId: { in: registrations.map((r) => r.eventId) },
    },
  });
  const certifiedEventIds = new Set(certificates.map((c) => c.eventId));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">🗓️ My events</h1>

      {registrations.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t registered for any events yet — plenty to explore!{" "}
          <Link href="/events" className="underline">
            Browse events 📅
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {registrations.map(({ event }) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-gray-400"
            >
              <Link href={`/events/${event.slug}`}>
                <p className="text-sm text-gray-500 dark:text-slate-400">{EVENT_TYPE_LABELS[event.type]}</p>
                <h2 className="font-medium">{event.title}</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {formatDateRange(event.startDate, event.endDate)}
                </p>
              </Link>
              {certifiedEventIds.has(event.id) && (
                <Link
                  href="/dashboard/certificates"
                  className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                >
                  🎓 Certificate
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
