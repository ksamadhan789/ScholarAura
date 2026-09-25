import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import { Avatar } from "@/components/Avatar";
import type { AuditAction } from "@/lib/auditLog";
import { ScrollText } from "lucide-react";
import {
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";

const ACTION_LABELS: Record<AuditAction, string> = {
  REFUND_ISSUED: "Refund issued",
  REFUND_REQUEST_APPROVED: "Refund request approved",
  REFUND_REQUEST_REJECTED: "Refund request rejected",
  RECRUITER_APPROVED: "Recruiter account approved",
  RECRUITER_REJECTED: "Recruiter account rejected",
  JOB_APPROVED: "Job posting approved",
  JOB_REJECTED: "Job posting rejected",
  COUPON_CREATED: "Coupon created",
  COUPON_UPDATED: "Coupon updated",
  COUPON_DELETED: "Coupon deleted",
  CURRENCY_RATE_SET: "Currency rate set",
  CURRENCY_RATE_DELETED: "Currency rate deleted",
  AFFILIATE_RATE_SET: "Affiliate status/rate set",
  INSTRUCTOR_COMMISSION_SET: "Instructor commission rate set",
  JOB_APPLICATION_STATUS_CHANGED: "Job application status changed",
  COLLEGE_APPROVED: "College approved",
  COLLEGE_REJECTED: "College rejected",
  BUNDLE_CREATED: "Bundle created",
  BUNDLE_UPDATED: "Bundle updated",
  BUNDLE_DELETED: "Bundle deleted",
  SUPPORT_TICKET_RESOLVED: "Support ticket resolved",
  FREELANCE_REPORT_DISMISSED: "Freelance report dismissed",
  FREELANCE_LISTING_REMOVED: "Freelance listing removed",
  FREELANCE_LISTING_RESTORED: "Freelance listing restored",
  WEBHOOK_SECRET_REGENERATED: "Form webhook secret regenerated",
};

function formatMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export default async function AuditLogPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const page = Math.max(1, Number(searchParams.page) || 1);

  const [entries, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: { select: { id: true, name: true, email: true, photoFileId: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <DashboardShell
      title="Audit log"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="A record of admin decisions — refunds, approvals, coupons, rates and moderation — who did what, and when."
    >
      {entries.length === 0 ? (
        <DashboardEmptyState icon={ScrollText} title="No admin actions recorded yet" />
      ) : (
        <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
          <table className="w-full text-left text-sm">
            <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
              <tr>
                <th className={DASHBOARD_TH_CLASS}>When</th>
                <th className={DASHBOARD_TH_CLASS}>Admin</th>
                <th className={DASHBOARD_TH_CLASS}>Action</th>
                <th className={DASHBOARD_TH_CLASS}>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={DASHBOARD_TR_CLASS}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                    {entry.createdAt.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={entry.actor.name}
                        src={entry.actor.photoFileId ? `/api/admin/users/${entry.actor.id}/photo` : null}
                        size={28}
                      />
                      <div>
                        {entry.actor.name}
                        <p className="text-xs text-slate-500 dark:text-slate-400">{entry.actor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {ACTION_LABELS[entry.action as AuditAction] ?? entry.action}
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      {entry.targetType} · {entry.targetId.slice(0, 8)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatMetadata(entry.metadata) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} basePath="/dashboard/admin/audit-log" />
    </DashboardShell>
  );
}
