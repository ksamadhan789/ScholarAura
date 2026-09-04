import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS, formatDateRange } from "@/lib/eventLabels";
import { issueEventCertificateIfEligible } from "@/lib/certificate";
import { buildGoogleFormUrl } from "@/lib/enrollment";
import { Badge } from "@/components/Badge";
import { CancelRegistrationButton } from "@/components/events/CancelRegistrationButton";
import { RequestRefundButton } from "@/components/RequestRefundButton";

const CERT_STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "Processing",
  PROCESSING: "Processing",
  FAILED: "Generation issue",
  REVOKED: "Revoked",
};
const CERT_STATUS_VARIANT: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  ELIGIBLE: "warning",
  PROCESSING: "brand",
  FAILED: "warning",
  REVOKED: "neutral",
};

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
    where: { userId: session.user.id, eventId: { in: registrations.map((r) => r.eventId) } },
  });
  const certByEventId = new Map(certificates.map((c) => [c.eventId, c]));

  const pendingRequests = await prisma.refundRequest.findMany({
    where: {
      status: "PENDING",
      eventRegistrationId: { in: registrations.map((r) => r.id) },
    },
    select: { eventRegistrationId: true },
  });
  const pendingRegistrationIds = new Set(pendingRequests.map((r) => r.eventRegistrationId));

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
          {registrations.map((r) => {
            const { event } = r;
            const googleFormUrl =
              !r.formSubmitted && r.enrollmentNumber
                ? buildGoogleFormUrl(event, {
                    name: r.certificateName ?? session.user.name ?? "",
                    email: session.user.email ?? "",
                    enrollmentNumber: r.enrollmentNumber,
                  })
                : null;
            const cert = certByEventId.get(event.id);
            const certReady = cert && (cert.status === "AVAILABLE" || cert.status === "GENERATED");

            return (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-gray-400"
              >
                <Link href={`/events/${event.slug}`}>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{EVENT_TYPE_LABELS[event.type]}</p>
                  <h2 className="font-medium">{event.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {formatDateRange(event.startDate, event.endDate)}
                  </p>
                  {r.enrollmentNumber && (
                    <p className="mt-1 font-mono text-xs text-gray-400 dark:text-slate-500">
                      {r.enrollmentNumber}
                    </p>
                  )}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/receipts/event/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                  >
                    🧾 Receipt
                  </a>
                  {r.formSubmitted && <Badge variant="success">Form submitted</Badge>}
                  {googleFormUrl && (
                    <a
                      href={googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                    >
                      📝 Complete Google Form
                    </a>
                  )}
                  {certReady ? (
                    <Link
                      href="/dashboard/certificates"
                      className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                    >
                      🎓 Certificate
                    </Link>
                  ) : (
                    cert && (
                      <Badge variant={CERT_STATUS_VARIANT[cert.status] ?? "neutral"}>
                        🎓 {CERT_STATUS_LABEL[cert.status] ?? cert.status}
                      </Badge>
                    )
                  )}
                  {Number(event.fee) === 0 && event.startDate > new Date() && (
                    <CancelRegistrationButton slug={event.slug} />
                  )}
                  {Number(r.amount) > 0 && (
                    <RequestRefundButton
                      kind="event"
                      itemId={r.id}
                      isPending={pendingRegistrationIds.has(r.id)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
