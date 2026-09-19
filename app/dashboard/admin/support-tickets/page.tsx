import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SupportTicketActions } from "./SupportTicketActions";

export default async function AdminSupportTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const tickets = await prisma.supportTicket.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Support tickets</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-slate-400">
        Raised from Aura when it couldn&apos;t answer a question. Replying emails the person back at
        the address they gave (and notifies them in-app if they have an account).
      </p>

      {tickets.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No open support tickets.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {t.name} · {t.email}
                    {!t.userId && (
                      <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-normal text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                        Guest
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    Asked: &ldquo;{t.query}&rdquo;
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.message}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                    Raised {t.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <SupportTicketActions ticketId={t.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
