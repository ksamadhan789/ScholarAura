import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
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
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Manage affiliates</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-slate-400">
        Search a user by email to approve them as an affiliate with a custom commission
        rate. Everyone else earns the default {" "}
        referral rate automatically — no approval needed.
      </p>
      <AffiliateManager />
    </main>
  );
}
