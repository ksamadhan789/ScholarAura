import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { RecruiterApprovalActions } from "./RecruiterApprovalActions";

const STATUS_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "neutral",
};

export default async function AdminRecruitersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const recruiters = await prisma.recruiterProfile.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Recruiter accounts</h1>

      {recruiters.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-400">No recruiter accounts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recruiters.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <p className="font-medium">{r.companyName}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {r.user.name} · {r.user.email}
                </p>
                {r.companyWebsite && (
                  <a
                    href={r.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-brand-600 underline dark:text-brand-400"
                  >
                    {r.companyWebsite}
                  </a>
                )}
                <div className="mt-1">
                  <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{r.status}</Badge>
                </div>
              </div>
              {r.status === "PENDING" && <RecruiterApprovalActions recruiterId={r.id} />}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
