import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CollegeModerationActions } from "./CollegeModerationActions";
import { GraduationCap } from "lucide-react";
import { DASHBOARD_CARD_CLASS, DashboardEmptyState, DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function CollegesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const pendingColleges = await prisma.college.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      title="Colleges awaiting review"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description={`${pendingColleges.length} college${pendingColleges.length === 1 ? "" : "s"} pending. Approved colleges show up in the onboarding autocomplete immediately.`}
    >
      {pendingColleges.length === 0 ? (
        <DashboardEmptyState icon={GraduationCap} title="Nothing to review right now" />
      ) : (
        <ul className="space-y-3">
          {pendingColleges.map((college) => (
            <li
              key={college.id}
              className={`${DASHBOARD_CARD_CLASS} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <GraduationCap aria-hidden className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">{college.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {[college.city, college.state].filter(Boolean).join(", ") || "Location not given"}
                    {college.university ? ` · ${college.university}` : ""}
                    {college.collegeType ? ` · ${college.collegeType}` : ""}
                  </p>
                </div>
              </div>
              <CollegeModerationActions id={college.id} />
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
