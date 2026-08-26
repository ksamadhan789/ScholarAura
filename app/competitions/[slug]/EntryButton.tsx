"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadRazorpayScript } from "@/lib/loadRazorpayScript";
import { CurrencySelector } from "@/components/CurrencySelector";

type Rate = { currencyCode: string; symbol: string; rateFromInr: string };

export function EntryButton({
  slug,
  isPaid,
  price,
  rates,
  allowTeam,
  userName,
  userEmail,
}: {
  slug: string;
  isPaid: boolean;
  price: number;
  rates: Rate[];
  allowTeam: boolean;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState("INR");
  const [teamName, setTeamName] = useState("");
  const [teammates, setTeammates] = useState("");
  const [certificateName, setCertificateName] = useState(userName ?? "");
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedFormUrl, setBlockedFormUrl] = useState<string | null>(null);

  // Opens the Google Form and, if the browser's popup blocker silently
  // swallowed it (common since this runs after an awaited fetch, breaking
  // the direct-click gesture chain most blockers require), surfaces a
  // manual link instead of just redirecting the entrant away with no way
  // to reach the form.
  function openGoogleForm(url: string): boolean {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      setBlockedFormUrl(url);
      setLoading(false);
      return false;
    }
    return true;
  }

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const checkoutRes = await fetch(`/api/competitions/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          teamName: teamName || undefined,
          teammates: teammates || undefined,
          certificateName,
          couponCode: couponCode || undefined,
        }),
      });
      if (!checkoutRes.ok) {
        const data = await checkoutRes.json().catch(() => null);
        setError(data?.error ?? "Couldn't start checkout. Please try again.");
        return;
      }
      const order = await checkoutRes.json();

      // Covers both free entries and credit-covered ones — the checkout
      // route settles those immediately without a Razorpay order.
      if (order.paidWithCredit) {
        if (order.googleFormUrl && !openGoogleForm(order.googleFormUrl)) {
          return;
        }
        router.push(`/competitions/${slug}`);
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
        name: order.competitionName,
        description: "Competition entry",
        prefill: { name: userName ?? undefined, email: userEmail ?? undefined },
        theme: { color: "#000000" },
        handler: async (response) => {
          const verifyRes = await fetch(`/api/competitions/${slug}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!verifyRes.ok) {
            const data = await verifyRes.json().catch(() => null);
            setError(data?.error ?? "Payment succeeded but we couldn't confirm it. Contact support.");
            return;
          }
          const verifyData = await verifyRes.json().catch(() => null);
          if (verifyData?.googleFormUrl && !openGoogleForm(verifyData.googleFormUrl)) {
            return;
          }
          router.push(`/competitions/${slug}`);
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
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Name to print on certificate</label>
        <input
          type="text"
          value={certificateName}
          onChange={(e) => setCertificateName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
        />
      </div>
      {allowTeam && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">Team name (optional)</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Teammates (optional)</label>
            <textarea
              rows={2}
              placeholder="Names and emails of your teammates"
              value={teammates}
              onChange={(e) => setTeammates(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
            />
          </div>
        </>
      )}
      {isPaid && (
        <>
          <CurrencySelector priceInInr={price} rates={rates} value={currency} onChange={setCurrency} />
          <input
            type="text"
            placeholder="Coupon code (optional)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm uppercase"
          />
        </>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-5 py-2.5 text-white disabled:opacity-50"
      >
        {loading ? "Please wait…" : isPaid ? "Enter & Pay" : "Enter competition"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {blockedFormUrl && (
        <div className="rounded border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 p-3 text-sm">
          <p className="mb-2">
            🎉 You&apos;re entered! Your browser blocked the Google Form from opening automatically.
          </p>
          <a
            href={blockedFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-3 underline"
          >
            Open the Google Form →
          </a>
          <button
            type="button"
            onClick={() => {
              router.push(`/competitions/${slug}`);
              router.refresh();
            }}
            className="underline"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
