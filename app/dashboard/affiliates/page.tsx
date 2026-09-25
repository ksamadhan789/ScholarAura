import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DEFAULT_REFERRAL_RATE_PERCENT } from "@/lib/referralConstants";
import { AffiliateManager } from "./AffiliateManager";

export default async function AffiliatesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell
      title="Manage affiliates"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description={
        <>
          Search a user by email to approve them as an affiliate with a custom commission rate. Everyone else earns the
          default {DEFAULT_REFERRAL_RATE_PERCENT}% referral rate automatically — no approval needed.
        </>
      }
    >
      <AffiliateManager />
    </DashboardShell>
  );
}
