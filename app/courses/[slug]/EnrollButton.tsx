"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadRazorpayScript } from "@/lib/loadRazorpayScript";
import { CurrencySelector } from "@/components/CurrencySelector";

type Rate = { currencyCode: string; symbol: string; rateFromInr: string };

export function EnrollButton({
  slug,
  isPaid,
  price,
  rates,
  userName,
  userEmail,
}: {
  slug: string;
  isPaid: boolean;
  price: number;
  rates: Rate[];
  userName?: string | null;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFreeEnroll() {
    const res = await fetch(`/api/courses/${slug}/enroll`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't enroll. Please try again.");
      return;
    }
    router.push("/dashboard/learning");
    router.refresh();
  }

  async function handlePaidEnroll() {
    const checkoutRes = await fetch(`/api/courses/${slug}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency }),
    });
    if (!checkoutRes.ok) {
      const data = await checkoutRes.json().catch(() => null);
      setError(data?.error ?? "Couldn't start checkout. Please try again.");
      return;
    }
    const order = await checkoutRes.json();

    if (order.paidWithCredit) {
      router.push("/dashboard/learning");
      router.refresh();
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Couldn't load the payment form. Check your connection and try again.");
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: order.courseName,
      description: "Course purchase",
      prefill: { name: userName ?? undefined, email: userEmail ?? undefined },
      theme: { color: "#000000" },
      handler: async (response) => {
        const verifyRes = await fetch(`/api/courses/${slug}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (!verifyRes.ok) {
          setError("Payment succeeded but we couldn't confirm it. Contact support.");
          return;
        }
        router.push("/dashboard/learning");
        router.refresh();
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    });

    razorpay.open();
  }

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      if (isPaid) {
        await handlePaidEnroll();
      } else {
        await handleFreeEnroll();
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      if (!isPaid) setLoading(false);
    }
  }

  return (
    <div>
      {isPaid && (
        <CurrencySelector
          priceInInr={price}
          rates={rates}
          value={currency}
          onChange={setCurrency}
        />
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white disabled:opacity-50"
      >
        {loading ? "Please wait…" : isPaid ? "Enroll & Pay" : "Enroll"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
