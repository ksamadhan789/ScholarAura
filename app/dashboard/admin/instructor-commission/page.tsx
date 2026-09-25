import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
    <DashboardShell
      title="Instructor commission rates"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description={
        <>
          Search an instructor by email to set a custom commission rate. Everyone else earns the site default of{" "}
          {DEFAULT_INSTRUCTOR_COMMISSION_RATE_PERCENT}% of net course revenue automatically — this only affects what
          instructors see on their earnings page, it doesn&apos;t move any money.
        </>
      }
    >
      <InstructorCommissionManager />
    </DashboardShell>
  );
}
