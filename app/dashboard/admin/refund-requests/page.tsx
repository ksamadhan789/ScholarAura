import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RefundRequestActions } from "./RefundRequestActions";

export default async function AdminRefundRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const requests = await prisma.refundRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true } },
      coursePurchase: { include: { course: { select: { title: true } } } },
      eventRegistration: { include: { event: { select: { title: true } } } },
      competitionEntry: { include: { competition: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Refund requests</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-slate-400">
        Approving here issues the refund immediately (same as the manual refund button on the
        purchase itself) and emails the student.
      </p>

      {requests.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No pending refund requests.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => {
            const item = r.coursePurchase
              ? { kind: "Course", title: r.coursePurchase.course.title, amount: r.coursePurchase.amount }
              : r.eventRegistration
                ? { kind: "Event", title: r.eventRegistration.event.title, amount: r.eventRegistration.amount }
                : { kind: "Competition", title: r.competitionEntry!.competition.title, amount: r.competitionEntry!.amount };

            return (
              <div
                key={r.id}
                className="rounded border border-gray-200 dark:border-slate-700 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {item.kind}: {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {r.user.name} · {r.user.email} · ₹{Number(item.amount).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      &ldquo;{r.reason}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                      Requested {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <RefundRequestActions requestId={r.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
