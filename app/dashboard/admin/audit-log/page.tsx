import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import type { AuditAction } from "@/lib/auditLog";

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
};

function formatMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const entries = Object.entries(metadata as Record<string, unknown>).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return null;
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
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
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/dashboard/admin" className="text-sm text-gray-500 hover:underline dark:text-slate-400">
        ← Admin
      </Link>
      <h1 className="mt-2 mb-2 text-2xl font-semibold">Audit log</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        A record of admin decisions on refunds and recruiter/job approvals — who did what, and when.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No admin actions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Admin</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-200 dark:border-slate-700 align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {entry.createdAt.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.actor.name}
                    <p className="text-xs text-gray-500 dark:text-slate-400">{entry.actor.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    {ACTION_LABELS[entry.action as AuditAction] ?? entry.action}
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {entry.targetType} · {entry.targetId.slice(0, 8)}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {formatMetadata(entry.metadata) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} basePath="/dashboard/admin/audit-log" />
    </main>
  );
}
