import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueCompetitionCertificateIfEligible } from "@/lib/certificate";
import { buildGoogleFormUrl } from "@/lib/competitionEnrollment";
import { Badge } from "@/components/Badge";
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

export default async function MyCompetitionsPage() {
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
      .map((e) => issueCompetitionCertificateIfEligible(session.user.id, e.competitionId))
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">🏆 My competitions</h1>

      {entries.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">
          You haven&apos;t entered any competitions yet — plenty to explore!{" "}
          <Link href="/competitions" className="underline">
            Browse competitions 🏆
          </Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => {
            const { competition } = e;
            const googleFormUrl =
              !e.formSubmitted && e.enrollmentNumber
                ? buildGoogleFormUrl(competition, {
                    name: e.certificateName ?? session.user.name ?? "",
                    email: session.user.email ?? "",
                    enrollmentNumber: e.enrollmentNumber,
                  })
                : null;
            const cert = certByCompetitionId.get(competition.id);
            const certReady = cert && (cert.status === "AVAILABLE" || cert.status === "GENERATED");

            return (
              <div
                key={competition.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-4 hover:border-gray-400"
              >
                <Link href={`/competitions/${competition.slug}`}>
                  <h2 className="font-medium">{competition.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Submit by{" "}
                    {competition.submissionDeadline.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {e.enrollmentNumber && (
                    <p className="mt-1 font-mono text-xs text-gray-400 dark:text-slate-500">
                      {e.enrollmentNumber}
                    </p>
                  )}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/receipts/competition/${e.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm"
                  >
                    🧾 Receipt
                  </a>
                  {e.formSubmitted && <Badge variant="success">Form submitted</Badge>}
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
                  {Number(e.amount) > 0 && (
                    <RequestRefundButton
                      kind="competition"
                      itemId={e.id}
                      isPending={pendingEntryIds.has(e.id)}
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
