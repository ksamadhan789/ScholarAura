"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { loadRazorpayScript } from "@/lib/loadRazorpayScript";

/** Pays for one Pro period (monthly or yearly) — same Razorpay flow as a job Boost. */
export function PlanCheckoutButton({
  period,
  priceInr,
  label,
  userName,
  userEmail,
  variant = "primary",
}: {
  period: "MONTHLY" | "YEARLY";
  priceInr: number;
  label: string;
  userName?: string | null;
  userEmail?: string | null;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const checkoutRes = await fetch("/api/recruiter/plan/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const order = await checkoutRes.json().catch(() => null);
      if (!checkoutRes.ok) {
        setError(order?.error ?? "Couldn't start checkout. Please try again.");
        setLoading(false);
        return;
      }

      if (!(await loadRazorpayScript())) {
        setError("Couldn't load the payment form. Check your connection and try again.");
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ScholarAura Pro",
        description: period === "YEARLY" ? "Recruiter Pro — 1 year" : "Recruiter Pro — 30 days",
        prefill: { name: userName ?? undefined, email: userEmail ?? undefined },
        theme: { color: "#2563eb" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/recruiter/plan/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          setLoading(false);
          if (!verifyRes.ok) {
            setError("Payment succeeded but we couldn't confirm it yet — refresh in a minute, or contact support.");
            return;
          }
          setDone(true);
          router.refresh();
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 ${
          variant === "primary"
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        }`}
      >
        <Sparkles aria-hidden className="h-4 w-4" />
        {loading ? "Please wait…" : `${label} — ₹${priceInr.toLocaleString("en-IN")}`}
      </button>
      {done && (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Payment received — you&apos;re on Pro.
        </p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
