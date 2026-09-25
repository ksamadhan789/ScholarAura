import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RefundButton } from "@/components/RefundButton";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";
import {
  DASHBOARD_SECONDARY_BUTTON_CLASS,
  DASHBOARD_TABLE_HEAD_CLASS,
  DASHBOARD_TABLE_WRAPPER_CLASS,
  DASHBOARD_TH_CLASS,
  DASHBOARD_TR_CLASS,
  DashboardEmptyState,
  DashboardShell,
} from "@/components/dashboard/DashboardShell";
import { Download, Users } from "lucide-react";

const STATUS_VARIANT = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "neutral",
  ATTENDED: "brand",
  REFUNDED: "neutral",
} as const;

export default async function EventStudentsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
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

  const page = Math.max(1, Number(searchParams.page) || 1);

  const [registrations, totalCount] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { eventId: event.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { registeredAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.eventRegistration.count({ where: { eventId: event.id } }),
  ]);

  return (
    <DashboardShell
      title="Registrations"
      description={event.title}
      backHref="/dashboard/events"
      backLabel="Events"
      actions={
        <a href={`/api/admin/events/${event.slug}/students/export`} className={DASHBOARD_SECONDARY_BUTTON_CLASS}>
          <Download aria-hidden className="h-4 w-4" />
          Export CSV
        </a>
      }
    >
      {registrations.length === 0 ? (
        <DashboardEmptyState icon={Users} title="No one has registered for this event yet" />
      ) : (
        <div className={DASHBOARD_TABLE_WRAPPER_CLASS}>
          <table className="w-full text-left text-sm">
            <thead className={DASHBOARD_TABLE_HEAD_CLASS}>
              <tr>
                <th className={DASHBOARD_TH_CLASS}>Name</th>
                <th className={DASHBOARD_TH_CLASS}>Email</th>
                <th className={DASHBOARD_TH_CLASS}>Registered</th>
                <th className={DASHBOARD_TH_CLASS}>Payment status</th>
                <th className={DASHBOARD_TH_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id} className={DASHBOARD_TR_CLASS}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {registration.user.name}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${registration.user.email}`}
                      className="text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {registration.user.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {registration.registeredAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[registration.status]}>{registration.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {registration.status === "CONFIRMED" && (
                      <RefundButton refundUrl={`/api/admin/event-registrations/${registration.id}/refund`} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalCount={totalCount} basePath={`/dashboard/events/${event.slug}/students`} />
    </DashboardShell>
  );
}
