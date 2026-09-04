import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT } from "@/lib/instructorPayout";
import { InstructorCommissionManager } from "./InstructorCommissionManager";

export default async function InstructorCommissionAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Instructor commission rates</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-slate-400">
        Search an instructor by email to set a custom commission rate. Everyone else earns
        the site default of {DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT}% of net course revenue automatically —
        this only affects what instructors see on their earnings page, it doesn&apos;t move any money.
      </p>
      <InstructorCommissionManager />
    </main>
  );
}
