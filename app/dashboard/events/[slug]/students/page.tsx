import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RefundButton } from "@/components/RefundButton";
import { Pagination, PAGE_SIZE } from "@/components/Pagination";

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
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/dashboard/events" className="text-sm text-gray-500 hover:underline dark:text-slate-400">
        ← Manage events
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{event.title} — Registrations</h1>

      {registrations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No one has registered for this event yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Registered</th>
                <th className="px-4 py-2.5 font-medium">Payment status</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id} className="border-t border-gray-200 dark:border-slate-700">
                  <td className="px-4 py-2.5">{registration.user.name}</td>
                  <td className="px-4 py-2.5">
                    <a href={`mailto:${registration.user.email}`} className="underline">
                      {registration.user.email}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-slate-400">
                    {registration.registeredAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[registration.status]}>{registration.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
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
    </main>
  );
}
