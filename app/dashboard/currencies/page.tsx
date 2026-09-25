import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { prisma } from "@/lib/prisma";
import { CurrencyManager } from "./CurrencyManager";

export default async function CurrenciesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const rates = await prisma.exchangeRate.findMany({ orderBy: { currencyCode: "asc" } });
  const serialized = rates.map((r) => ({
    id: r.id,
    currencyCode: r.currencyCode,
    symbol: r.symbol,
    rateFromInr: r.rateFromInr.toString(),
  }));

  return (
    <DashboardShell
      title="Currency rates"
      backHref="/dashboard/admin"
      backLabel="Admin"
      description={
        "Course and event prices are always set in ₹ INR. Add exchange rates here so international visitors can pay in their own currency — actual charging still depends on your Razorpay account being approved for that currency."
      }
    >
      <CurrencyManager initialRates={serialized} />
    </DashboardShell>
  );
}
