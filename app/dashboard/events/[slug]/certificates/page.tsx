import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { issueEventCertificateIfEligible } from "@/lib/certificate";
import { getConnectedGoogleEmail } from "@/lib/google/delegatedAuth";
import { SyncAttendanceButton } from "./SyncAttendanceButton";
import { ProcessPendingButton } from "./ProcessPendingButton";
import { CertificateActionButton } from "./CertificateActionButton";
import { RevokeCertificateButton } from "./RevokeCertificateButton";
import { DisconnectDriveButton } from "./DisconnectDriveButton";

const CERT_STATUS_VARIANT: Record<string, "success" | "warning" | "brand" | "neutral"> = {
  ELIGIBLE: "warning",
  PROCESSING: "brand",
  GENERATED: "success",
  AVAILABLE: "success",
  FAILED: "warning",
  REVOKED: "neutral",
  NOT_ELIGIBLE: "neutral",
};

export default async function EventCertificatesPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { driveConnected?: string; driveError?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const event = await prisma.event.findUnique({ where: { slug: params.slug } });
  if (!event) {
    notFound();
  }

  const connectedEmail = await getConnectedGoogleEmail();
  const returnTo = `/dashboard/events/${event.slug}/certificates`;

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId: event.id, status: "CONFIRMED" },
    include: { user: { select: { id: true, name: true, email: true, organization: true } } },
    orderBy: { registeredAt: "asc" },
  });

  // Certificates are otherwise only lazily issued when a student visits their
  // own dashboard — do the same eager check here so an admin can drive
  // generation without waiting on that. allSettled so one failure can't take
  // down the whole page.
  const issuanceResults = await Promise.allSettled(
    registrations.map((r) => issueEventCertificateIfEligible(r.userId, event.id))
  );
  for (const result of issuanceResults) {
    if (result.status === "rejected") {
      console.error("Certificate issuance failed:", result.reason);
    }
  }

  const certificates = await prisma.certificate.findMany({ where: { eventId: event.id } });
  const certByUserId = new Map(certificates.map((c) => [c.userId, c]));

  const hasTemplate = !!event.googleSlidesTemplateId;

  const stats = [
    ["Registered", registrations.length],
    ["Attendance verified", registrations.filter((r) => r.attendanceVerifiedAt).length],
    ["Eligible", registrations.filter((r) => r.eligibleForCertificate).length],
    ["Generated", certificates.filter((c) => c.status === "AVAILABLE" || c.status === "GENERATED").length],
    ["Pending", certificates.filter((c) => c.status === "ELIGIBLE" || c.status === "PROCESSING").length],
    ["Failed", certificates.filter((c) => c.status === "FAILED").length],
  ] as const;

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <Link href="/dashboard/events" className="text-sm text-gray-500 hover:underline dark:text-slate-400">
        ← Manage events
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{event.title} — Certificates</h1>
        <div className="flex gap-2">
          <SyncAttendanceButton slug={event.slug} />
          {hasTemplate && <ProcessPendingButton />}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 dark:border-slate-700 p-3 text-sm">
        {connectedEmail ? (
          <>
            <span className="text-gray-600 dark:text-slate-300">
              ✓ Google Drive connected as <span className="font-medium">{connectedEmail}</span>
            </span>
            <DisconnectDriveButton />
          </>
        ) : (
          <>
            <span className="text-amber-700 dark:text-amber-400">
              ⚠️ No Google Drive account connected — certificate generation will fail until one is.
            </span>
            <a
              href={`/api/admin/google-drive/connect?returnTo=${encodeURIComponent(returnTo)}`}
              className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-3 py-1.5 text-sm text-white"
            >
              Connect Google Drive
            </a>
          </>
        )}
      </div>
      {searchParams.driveConnected && (
        <p className="mb-4 text-sm text-green-700 dark:text-green-400">✓ Google Drive connected successfully.</p>
      )}
      {searchParams.driveError && (
        <p className="mb-4 text-sm text-red-700 dark:text-red-400">
          Google Drive connection failed ({searchParams.driveError}). Please try again.
        </p>
      )}

      {!hasTemplate && (
        <p className="mb-6 rounded border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-300">
          No Google Slides certificate template is configured for this event — set one on the Edit page to enable
          automated certificate generation. Certificates will otherwise use the default in-house design.
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {registrations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No confirmed registrations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Enrollment #</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">College</th>
                <th className="px-4 py-2.5 font-medium">Form</th>
                <th className="px-4 py-2.5 font-medium">Attendance</th>
                <th className="px-4 py-2.5 font-medium">Eligible</th>
                <th className="px-4 py-2.5 font-medium">Certificate</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const cert = certByUserId.get(r.userId);
                return (
                  <tr key={r.id} className="border-t border-gray-200 dark:border-slate-700 align-top">
                    <td className="px-4 py-2.5 font-mono text-xs">{r.enrollmentNumber ?? "—"}</td>
                    <td className="px-4 py-2.5">{r.user.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{r.user.email}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">{r.user.organization ?? "—"}</td>
                    <td className="px-4 py-2.5">{r.formSubmitted ? "✓" : "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                      {r.attendancePercent != null ? `${r.attendancePercent}%` : "—"}
                    </td>
                    <td className="px-4 py-2.5">{r.eligibleForCertificate ? "✓" : "—"}</td>
                    <td className="px-4 py-2.5">
                      {cert ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant={CERT_STATUS_VARIANT[cert.status] ?? "neutral"}>{cert.status}</Badge>
                          {cert.status === "FAILED" && cert.errorMessage && (
                            <span
                              className="max-w-[16rem] text-xs text-red-600 dark:text-red-400"
                              title={cert.errorMessage}
                            >
                              {cert.errorMessage.length > 60
                                ? `${cert.errorMessage.slice(0, 60)}…`
                                : cert.errorMessage}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {cert ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(cert.status === "AVAILABLE" || cert.status === "GENERATED") && (
                            <a
                              href={`/api/certificates/${cert.certificateNumber}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded border border-gray-300 dark:border-slate-600 px-2.5 py-1 text-xs"
                            >
                              View PDF
                            </a>
                          )}
                          {hasTemplate && (cert.status === "ELIGIBLE" || cert.status === "FAILED") && (
                            <CertificateActionButton
                              code={cert.certificateNumber}
                              action="generate"
                              label="Generate"
                            />
                          )}
                          {hasTemplate && cert.status === "AVAILABLE" && (
                            <CertificateActionButton
                              code={cert.certificateNumber}
                              action="regenerate"
                              label="Regenerate"
                            />
                          )}
                          {cert.status === "AVAILABLE" && (
                            <RevokeCertificateButton code={cert.certificateNumber} />
                          )}
                          {cert.status === "REVOKED" && (
                            <CertificateActionButton
                              code={cert.certificateNumber}
                              action="restore"
                              label="Restore"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {r.eligibleForCertificate ? "Not yet issued" : "Not eligible yet"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
