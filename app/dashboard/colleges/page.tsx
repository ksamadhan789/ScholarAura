import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CollegeModerationActions } from "./CollegeModerationActions";

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
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Colleges awaiting review</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
        {pendingColleges.length} college{pendingColleges.length === 1 ? "" : "s"} pending approval.
        Approved colleges start showing up in the onboarding autocomplete immediately.
      </p>

      {pendingColleges.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-slate-400">Nothing to review right now.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {pendingColleges.map((college) => (
            <div
              key={college.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
            >
              <div>
                <p className="font-medium">{college.name}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {[college.city, college.state].filter(Boolean).join(", ") || "—"}
                  {college.university ? ` · ${college.university}` : ""}
                  {college.collegeType ? ` · ${college.collegeType}` : ""}
                </p>
              </div>
              <CollegeModerationActions id={college.id} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
