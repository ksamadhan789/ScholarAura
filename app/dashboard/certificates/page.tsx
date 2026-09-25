import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AlertTriangle, Award, BadgeCheck, Download, Hourglass, Share2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";
import { SITE_URL } from "@/lib/siteUrl";
import { PublicProfileToggle } from "@/components/certificates/PublicProfileToggle";
import { buildLinkedInAddCertificateUrl } from "@/lib/shareLinks";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

const STATUS_LABEL: Record<string, string> = {
  ELIGIBLE: "Being generated — it will appear here when ready",
  PROCESSING: "Being generated — it will appear here when ready",
  FAILED: "Generation issue — we're on it",
  REVOKED: "Revoked",
};

export default async function MyCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const [certificates, user] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId: session.user.id },
      include: { course: true, event: true, competition: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { publicProfileEnabled: true },
    }),
  ]);
  const readyCount = certificates.filter((c) => c.status === "AVAILABLE" || c.status === "GENERATED").length;

  return (
    <DashboardShell
      title="My certificates"
      description={
        certificates.length > 0
          ? `${readyCount} ${readyCount === 1 ? "certificate" : "certificates"} ready · each one can be verified by anyone`
          : "Certificates you earn from courses, events and competitions show up here."
      }
    >
      <PublicProfileToggle
        initialEnabled={user.publicProfileEnabled}
        portfolioUrl={`${SITE_URL}/portfolio/${session.user.id}`}
      />

      <div className="mt-6">
        {certificates.length === 0 ? (
          <DashboardEmptyState
            icon={Award}
            title="No certificates yet"
            text="Finish a course or attend an event to earn one — every certificate gets its own verification page."
            href="/courses"
            cta="Browse courses"
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {certificates.map((cert) => {
              const ready = cert.status === "AVAILABLE" || cert.status === "GENERATED";
              const title =
                cert.course?.title ?? cert.event?.title ?? cert.competition?.title ?? "ScholarAura certificate";
              const kind = cert.course
                ? "Course"
                : cert.event
                  ? EVENT_TYPE_LABELS[cert.event.type]
                  : cert.competition
                    ? "Competition"
                    : "Certificate";
              const issued = cert.issuedAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              });

              return (
                <li key={cert.id} className={`${DASHBOARD_CARD_CLASS} flex flex-col p-5`}>
                  <div className="flex gap-4">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        ready
                          ? "bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-700"
                      }`}
                    >
                      <Award aria-hidden className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {kind}
                      </p>
                      <h2 className="mt-0.5 font-semibold leading-snug text-slate-900 dark:text-white">{title}</h2>
                      {ready && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Issued {issued}</p>}
                      <p className="mt-0.5 break-all font-mono text-xs text-slate-400">{cert.certificateNumber}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-5">
                    {ready ? (
                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                        <a
                          href={cert.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}
                        >
                          <Download aria-hidden className="h-4 w-4" />
                          Download
                        </a>
                        <a
                          href={`/verify/${cert.certificateNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                        >
                          <BadgeCheck aria-hidden className="h-4 w-4 text-emerald-600" />
                          Verify
                        </a>
                        <a
                          href={buildLinkedInAddCertificateUrl({
                            name: title,
                            issuedAt: cert.issuedAt,
                            certUrl: `${SITE_URL}/verify/${cert.certificateNumber}`,
                            certId: cert.certificateNumber,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                        >
                          <Share2 aria-hidden className="h-4 w-4 text-[#0A66C2]" />
                          Add to LinkedIn
                        </a>
                      </div>
                    ) : (
                      <p
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                          cert.status === "FAILED"
                            ? "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                            : "bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300"
                        }`}
                      >
                        {cert.status === "FAILED" ? (
                          <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />
                        ) : (
                          <Hourglass aria-hidden className="h-4 w-4 shrink-0" />
                        )}
                        {STATUS_LABEL[cert.status] ?? cert.status}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
