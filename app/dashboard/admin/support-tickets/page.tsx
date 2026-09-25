import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { SupportTicketActions } from "./SupportTicketActions";
import { LifeBuoy, Mail } from "lucide-react";
import { Badge } from "@/components/Badge";
import { DASHBOARD_CARD_CLASS, DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AdminSupportTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const tickets = await prisma.supportTicket.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      title="Support tickets"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description="Raised from Aura when it couldn't answer a question. Replying emails the person at the address they gave (and notifies them in-app if they have an account)."
    >
      {tickets.length === 0 ? (
        <DashboardEmptyState icon={LifeBuoy} title="No open support tickets" text="You're all caught up." />
      ) : (
        <ul className="space-y-4">
          {tickets.map((t) => (
            <li
              key={t.id}
              className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between`}
            >
              <div className="flex min-w-0 gap-4">
                <Avatar name={t.name} src={t.userId ? `/api/admin/users/${t.userId}/photo` : null} size={44} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    {!t.userId && <Badge variant="neutral">Guest</Badge>}
                  </div>
                  <a
                    href={`mailto:${t.email}`}
                    className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-400"
                  >
                    <Mail aria-hidden className="h-4 w-4" />
                    {t.email}
                  </a>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Asked Aura</p>
                  <blockquote className="mt-1 rounded-xl border-l-4 border-brand-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 dark:border-brand-800 dark:bg-slate-900/40 dark:text-slate-300">
                    {t.query}
                  </blockquote>
                  {t.message && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{t.message}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Raised{" "}
                    {t.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                </div>
              </div>
              <SupportTicketActions ticketId={t.id} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
