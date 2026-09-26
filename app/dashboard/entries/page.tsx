import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueCompetitionCertificateIfEligible } from "@/lib/certificate";
import { Badge } from "@/components/Badge";
import { RequestRefundButton } from "@/components/RequestRefundButton";
import { Award, Clock, Receipt, Trophy, Upload } from "lucide-react";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_PRIMARY_BUTTON_CLASS,
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DashboardEmptyState,
  DashboardShell,
  DashboardTabs,
  DateTile,
} from "@/components/dashboard/DashboardShell";

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

export default async function MyCompetitionsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const entries = await prisma.competitionEntry.findMany({
    where: { userId: session.user.id, status: "SUCCESS" },
    include: { competition: true },
    orderBy: { competition: { startDate: "asc" } },
  });

  // Concluded competitions auto-issue a certificate the next time the
  // entrant visits this page — same lazy-issuance pattern as My Events.
  // allSettled so one certificate-issuance failure can't take down the page.
  const issuanceResults = await Promise.allSettled(
    entries
      .filter((e) => e.competition.endDate < new Date())
      .map((e) => issueCompetitionCertificateIfEligible(session.user.id, e.competitionId)),
  );
  for (const result of issuanceResults) {
    if (result.status === "rejected") {
      console.error("Certificate issuance failed:", result.reason);
    }
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id, competitionId: { in: entries.map((e) => e.competitionId) } },
  });
  const certByCompetitionId = new Map(certificates.map((c) => [c.competitionId, c]));

  const pendingRequests = await prisma.refundRequest.findMany({
    where: {
      status: "PENDING",
      competitionEntryId: { in: entries.map((e) => e.id) },
    },
    select: { competitionEntryId: true },
  });
  const pendingEntryIds = new Set(pendingRequests.map((r) => r.competitionEntryId));

  const now = new Date();
  const active = entries.filter((e) => e.competition.endDate >= now);
  const past = entries.filter((e) => e.competition.endDate < now).reverse();
  const tab = searchParams.tab === "past" ? "past" : "active";
  const visible = tab === "past" ? past : active;

  return (
    <DashboardShell
      title="My competitions"
      description={
        entries.length > 0
          ? `${active.length} active · ${past.length} past`
          : "Competitions you enter show up here, with your submission details and certificates."
      }
      actions={
        entries.length > 0 && (
          <Link href="/competitions" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
            <Trophy aria-hidden className="h-4 w-4" />
            Browse competitions
          </Link>
        )
      }
    >
      {entries.length === 0 ? (
        <DashboardEmptyState
          icon={Trophy}
          title="You haven't entered a competition yet"
          text="Test your skills against other students and professionals."
          href="/competitions"
          cta="Browse competitions"
        />
      ) : (
        <>
          <DashboardTabs
            active={tab}
            tabs={[
              { key: "active", label: "Active", count: active.length, href: "/dashboard/entries" },
              { key: "past", label: "Past", count: past.length, href: "/dashboard/entries?tab=past" },
            ]}
          />

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
              {tab === "past" ? "No past competitions yet." : "No active competitions right now."}
            </p>
          ) : (
            <ul className="space-y-4">
              {visible.map((e) => {
                const { competition } = e;
                const cert = certByCompetitionId.get(competition.id);
                const certReady = cert && (cert.status === "AVAILABLE" || cert.status === "GENERATED");
                const submissionsOpen = competition.submissionDeadline >= now;
                const isPast = competition.endDate < now;

                return (
                  <li key={competition.id} className={`${DASHBOARD_CARD_CLASS} p-5`}>
                    <div className="flex gap-4">
                      <DateTile date={competition.submissionDeadline} muted={!submissionsOpen} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {e.rank && e.rank <= 3 && (
                            <Badge variant="warning">
                              {e.rank === 1 ? "1st place" : e.rank === 2 ? "2nd place" : "3rd place"}
                            </Badge>
                          )}
                          {!isPast && (
                            <Badge variant={submissionsOpen ? "success" : "neutral"}>
                              {submissionsOpen ? "Submissions open" : "Submissions closed"}
                            </Badge>
                          )}
                        </div>
                        <Link
                          href={`/competitions/${competition.slug}`}
                          className="mt-1.5 block font-semibold leading-snug text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                        >
                          {competition.title}
                        </Link>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <Clock aria-hidden className="h-4 w-4" />
                          Submit by{" "}
                          {competition.submissionDeadline.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Kolkata",
                          })}
                        </p>
                        {e.enrollmentNumber && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Enrolment no.{" "}
                            <span className="font-mono text-slate-700 dark:text-slate-300">{e.enrollmentNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                      {submissionsOpen && (
                        <Link
                          href={`/competitions/${competition.slug}#submission`}
                          className={`${DASHBOARD_PRIMARY_BUTTON_CLASS} py-1.5`}
                        >
                          <Upload aria-hidden className="h-4 w-4" />
                          Your submission
                        </Link>
                      )}
                      {certReady ? (
                        <Link href="/dashboard/certificates" className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
                          <Award aria-hidden className="h-4 w-4 text-amber-500" />
                          Certificate
                        </Link>
                      ) : (
                        cert && (
                          <Badge variant={CERT_STATUS_VARIANT[cert.status] ?? "neutral"}>
                            Certificate {(CERT_STATUS_LABEL[cert.status] ?? cert.status).toLowerCase()}
                          </Badge>
                        )
                      )}
                      <a
                        href={`/api/receipts/competition/${e.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={DASHBOARD_SECONDARY_BUTTON_CLASS}
                      >
                        <Receipt aria-hidden className="h-4 w-4" />
                        Receipt
                      </a>
                      {Number(e.amount) > 0 && (
                        <RequestRefundButton kind="competition" itemId={e.id} isPending={pendingEntryIds.has(e.id)} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </DashboardShell>
  );
}
