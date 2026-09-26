"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadRazorpayScript } from "@/lib/loadRazorpayScript";
import { CurrencySelector } from "@/components/CurrencySelector";
import { ActionStatus } from "@/components/detail/DetailLayout";
import { FormNextStep } from "@/components/detail/FormNextStep";

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
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState<string | null>(null);

  // Registered. The organiser's Google Form (if any) is shown as a link to
  // click rather than opened automatically: after a payment there's no
  // click left to open a tab from, so browsers block it, and a tab opened
  // up front would cover the payment window.
  function onRegistered(googleFormUrl: string | null | undefined) {
    setLoading(false);
    if (googleFormUrl) {
      setFormUrl(googleFormUrl);
      router.refresh();
      return;
    }
    router.push("/dashboard/registrations");
    router.refresh();
  }

  function fail(message: string) {
    setError(message);
    setLoading(false);
  }

  // Returns true if this response was handled (redirecting to onboarding),
  // so the caller should stop rather than also setting an error message.
  function redirectIfOnboardingRequired(data: { code?: string } | null): boolean {
    if (data?.code !== "ONBOARDING_REQUIRED") return false;
    router.push("/onboarding");
    return true;
  }

  async function handleFreeRegister() {
    const res = await fetch(`/api/events/${slug}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificateName }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (redirectIfOnboardingRequired(data)) return;
      fail(data?.error ?? "Couldn't register. Please try again.");
      return;
    }
    onRegistered(data?.googleFormUrl);
  }

  async function handlePaidRegister() {
    const checkoutRes = await fetch(`/api/events/${slug}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency, certificateName, couponCode: couponCode || undefined }),
    });
    if (!checkoutRes.ok) {
      const data = await checkoutRes.json().catch(() => null);
      if (redirectIfOnboardingRequired(data)) return;
      fail(data?.error ?? "Couldn't start checkout. Please try again.");
      return;
    }
    const order = await checkoutRes.json();

    if (order.paidWithCredit) {
      onRegistered(order.googleFormUrl);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      fail("Couldn't load the payment form. Check your connection and try again.");
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
        try {
          const verifyRes = await fetch(`/api/events/${slug}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const data = await verifyRes.json().catch(() => null);
          if (!verifyRes.ok) {
            fail(data?.error ?? "Payment succeeded but we couldn't confirm it. Contact support.");
            return;
          }
          onRegistered(data?.googleFormUrl);
        } catch {
          // The webhook still settles the payment; refreshing shows it once it has.
          fail("Payment received — we couldn't confirm it just now. Refresh the page in a minute.");
        }
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
      fail("Couldn't reach the server. Please try again.");
    }
  }

  if (formUrl) {
    return (
      <div className="flex flex-col gap-3">
        <ActionStatus tone="success">You&apos;re registered for this event!</ActionStatus>
        <FormNextStep url={formUrl} />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">Name to print on certificate</label>
      <input
        type="text"
        value={certificateName}
        onChange={(e) => setCertificateName(e.target.value)}
        placeholder="Full name"
        className="mb-3 w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
      />
      {isPaid && (
        <>
          <CurrencySelector priceInInr={price} rates={rates} value={currency} onChange={setCurrency} />
          <input
            type="text"
            placeholder="Coupon code (optional)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="mb-3 w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm uppercase"
          />
        </>
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
