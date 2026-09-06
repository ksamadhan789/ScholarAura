"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadRazorpayScript } from "@/lib/loadRazorpayScript";
import { CurrencySelector } from "@/components/CurrencySelector";

type Rate = { currencyCode: string; symbol: string; rateFromInr: string };

export function BoostJobButton({
  slug,
  priceInr,
  rates,
  userName,
  userEmail,
}: {
  slug: string;
  priceInr: number;
  rates: Rate[];
  userName?: string | null;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const checkoutRes = await fetch(`/api/jobs/${slug}/boost/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!checkoutRes.ok) {
        const data = await checkoutRes.json().catch(() => null);
        setError(data?.error ?? "Couldn't start checkout. Please try again.");
        setLoading(false);
        return;
      }
      const order = await checkoutRes.json();

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Couldn't load the payment form. Check your connection and try again.");
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: order.jobTitle,
        description: "Job listing boost",
        prefill: { name: userName ?? undefined, email: userEmail ?? undefined },
        theme: { color: "#000000" },
        handler: async (response) => {
          const verifyRes = await fetch(`/api/jobs/${slug}/boost/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!verifyRes.ok) {
            setError("Payment succeeded but we couldn't confirm it. Contact support.");
            return;
          }
          router.refresh();
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.open();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <CurrencySelector priceInInr={priceInr} rates={rates} value={currency} onChange={setCurrency} />
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white disabled:opacity-50"
      >
        {loading ? "Please wait…" : `Boost for ₹${priceInr}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
