"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadRazorpayScript } from "@/lib/loadRazorpayScript";
import { CurrencySelector } from "@/components/CurrencySelector";

type Rate = { currencyCode: string; symbol: string; rateFromInr: string };

export function RegisterButton({
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
  const [certificateName, setCertificateName] = useState(userName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFreeRegister() {
    const res = await fetch(`/api/events/${slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificateName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Couldn't register. Please try again.");
      return;
    }
    router.push("/dashboard/registrations");
    router.refresh();
  }

  async function handlePaidRegister() {
    const checkoutRes = await fetch(`/api/events/${slug}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency, certificateName }),
    });
    if (!checkoutRes.ok) {
      const data = await checkoutRes.json().catch(() => null);
      setError(data?.error ?? "Couldn't start checkout. Please try again.");
      return;
    }
    const order = await checkoutRes.json();

    if (order.paidWithCredit) {
      router.push("/dashboard/registrations");
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
      name: order.eventName,
      description: "Event registration",
      prefill: { name: userName ?? undefined, email: userEmail ?? undefined },
      theme: { color: "#000000" },
      handler: async (response) => {
        const verifyRes = await fetch(`/api/events/${slug}/verify-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        if (!verifyRes.ok) {
          const data = await verifyRes.json().catch(() => null);
          setError(data?.error ?? "Payment succeeded but we couldn't confirm it. Contact support.");
          return;
        }
        router.push("/dashboard/registrations");
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
        await handlePaidRegister();
      } else {
        await handleFreeRegister();
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      if (!isPaid) setLoading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">
        Name to print on certificate
      </label>
      <input
        type="text"
        value={certificateName}
        onChange={(e) => setCertificateName(e.target.value)}
        placeholder="Full name"
        className="mb-3 w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
      />
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
        {loading ? "Please wait…" : isPaid ? "Register & Pay" : "Register"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
