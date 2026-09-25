import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { issueEventCertificateIfEligible } from "@/lib/certificate";
import { getConnectedGoogleEmail } from "@/lib/google/delegatedAuth";
import { SyncAttendanceButton } from "@/components/certificates/SyncAttendanceButton";
import { ProcessPendingButton } from "@/components/certificates/ProcessPendingButton";
import { CertificateActionButton } from "@/components/certificates/CertificateActionButton";
import { RevokeCertificateButton } from "@/components/certificates/RevokeCertificateButton";
import { DriveStatusCard } from "@/components/certificates/DriveStatusCard";
import { BulkCertificateActions } from "@/components/certificates/BulkCertificateActions";
import { Avatar } from "@/components/Avatar";
import {
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardShell,
  YesNo,
} from "@/components/dashboard/DashboardShell";

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

  const [registrations, certificates] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { eventId: event.id, status: "CONFIRMED" },
      include: {
        user: { select: { id: true, name: true, email: true, organization: true, photoFileId: true } },
      },
      orderBy: { registeredAt: "asc" },
    }),
    prisma.certificate.findMany({ where: { eventId: event.id } }),
  ]);
  const certByUserId = new Map(certificates.map((c) => [c.userId, c]));

  // Certificates are otherwise only lazily issued when a student visits their
  // own dashboard — do the same eager check here so an admin can drive
  // generation without waiting on that. Only registrations without a
  // certificate yet need checking — re-running eligibility for every already
  // -issued registration on every page view doesn't scale once an event has
  // hundreds of registrations. allSettled so one failure can't take down the
  // whole page.
  const pendingRegistrations = registrations.filter((r) => !certByUserId.has(r.userId));
  const issuanceResults = await Promise.allSettled(
    pendingRegistrations.map((r) => issueEventCertificateIfEligible(r.userId, event.id)),
  );
  for (const result of issuanceResults) {
    if (result.status === "rejected") {
      console.error("Certificate issuance failed:", result.reason);
    } else if (result.value) {
      certByUserId.set(result.value.userId, result.value);
    }
  }

  const hasTemplate = !!event.googleSlidesTemplateId;
  const allCertificates = Array.from(certByUserId.values());
  const generatedCount = allCertificates.filter((c) => c.status === "AVAILABLE" || c.status === "GENERATED").length;

  const stats = [
    ["Registered", registrations.length],
    ["Attendance verified", registrations.filter((r) => r.attendanceVerifiedAt).length],
    ["Eligible", registrations.filter((r) => r.eligibleForCertificate).length],
    ["Generated", generatedCount],
    ["Pending", allCertificates.filter((c) => c.status === "ELIGIBLE" || c.status === "PROCESSING").length],
    ["Failed", allCertificates.filter((c) => c.status === "FAILED").length],
  ] as const;

  return (
    <DashboardShell
      title="Certificates"
      description={event.title}
      backHref="/dashboard/events"
      backLabel="Events"
      actions={
        <div className="flex flex-wrap items-start gap-2">
          <SyncAttendanceButton syncUrl={`/api/events/${event.slug}/sync-attendance`} />
          {hasTemplate && <ProcessPendingButton />}
          {generatedCount > 0 && <BulkCertificateActions eventId={event.id} />}
        </div>
      }
    >
      <div className="mb-6">
        <DriveStatusCard
          connectedEmail={connectedEmail}
          returnTo={returnTo}
          missingWarning="certificate generation will fail until one is."
          driveConnected={searchParams.driveConnected}
          driveError={searchParams.driveError}
        />
      </div>

      {!hasTemplate && (
        <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          No Google Slides certificate template is configured for this event — set one on the Edit page to enable
          automated certificate generation. Certificates will otherwise use the default in-house design.
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {registrations.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No confirmed registrations yet.</p>
      ) : (
        <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
          <table className="w-full text-left text-sm">
            <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
              <tr>
                <th className={DASHBOARD_TH_CLASS}>Enrollment #</th>
                <th className={DASHBOARD_TH_CLASS}>Name</th>
                <th className={DASHBOARD_TH_CLASS}>Email</th>
                <th className={DASHBOARD_TH_CLASS}>College</th>
                <th className={DASHBOARD_TH_CLASS}>Form</th>
                <th className={DASHBOARD_TH_CLASS}>Attendance</th>
                <th className={DASHBOARD_TH_CLASS}>Eligible</th>
                <th className={DASHBOARD_TH_CLASS}>Certificate</th>
                <th className={DASHBOARD_TH_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const cert = certByUserId.get(r.userId);
                return (
                  <tr key={r.id} className={DASHBOARD_TR_CLASS}>
                    <td className="px-4 py-3 font-mono text-xs">{r.enrollmentNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={r.user.name}
                          src={r.user.photoFileId ? `/api/admin/users/${r.user.id}/photo` : null}
                          size={28}
                        />
                        {r.user.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.user.email}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.user.organization ?? "—"}</td>
                    <td className="px-4 py-3">
                      <YesNo value={r.formSubmitted} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {r.attendancePercent != null ? `${r.attendancePercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <YesNo value={r.eligibleForCertificate} />
                    </td>
                    <td className="px-4 py-3">
                      {cert ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant={CERT_STATUS_VARIANT[cert.status] ?? "neutral"}>{cert.status}</Badge>
                          {cert.status === "FAILED" && cert.errorMessage && (
                            <span
                              className="max-w-[16rem] text-xs text-red-600 dark:text-red-400"
                              title={cert.errorMessage}
                            >
                              {cert.errorMessage.length > 60 ? `${cert.errorMessage.slice(0, 60)}…` : cert.errorMessage}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {cert ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(cert.status === "AVAILABLE" || cert.status === "GENERATED") && (
                            <a
                              href={`/api/certificates/${cert.certificateNumber}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              View PDF
                            </a>
                          )}
                          {hasTemplate && (cert.status === "ELIGIBLE" || cert.status === "FAILED") && (
                            <CertificateActionButton code={cert.certificateNumber} action="generate" label="Generate" />
                          )}
                          {hasTemplate && cert.status === "AVAILABLE" && (
                            <CertificateActionButton
                              code={cert.certificateNumber}
                              action="regenerate"
                              label="Regenerate"
                            />
                          )}
                          {cert.status === "AVAILABLE" && <RevokeCertificateButton code={cert.certificateNumber} />}
                          {cert.status === "REVOKED" && (
                            <CertificateActionButton code={cert.certificateNumber} action="restore" label="Restore" />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">
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
    </DashboardShell>
  );
}
