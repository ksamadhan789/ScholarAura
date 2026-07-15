import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
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
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Currency rates</h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-slate-400">
        Course and event prices are always set in ₹ INR. Add exchange rates here so
        international visitors can pay in their own currency — actual charging still
        depends on your Razorpay account being approved for that currency.
      </p>
      <CurrencyManager initialRates={serialized} />
    </main>
  );
}
