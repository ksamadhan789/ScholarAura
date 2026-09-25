"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DASHBOARD_INPUT_CLASS,
  DASHBOARD_LABEL_CLASS,
  DASHBOARD_CARD_CLASS,
} from "@/components/dashboard/DashboardShell";

type Rate = {
  id: string;
  currencyCode: string;
  symbol: string;
  rateFromInr: string;
};

export function CurrencyManager({ initialRates }: { initialRates: Rate[] }) {
  const router = useRouter();
  const [rates, setRates] = useState(initialRates);
  const [currencyCode, setCurrencyCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rateFromInr, setRateFromInr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRates(initialRates);
  }, [initialRates]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyCode, symbol, rateFromInr }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save. Please try again.");
        return;
      }
      setCurrencyCode("");
      setSymbol("");
      setRateFromInr("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(code: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/currencies/${code}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {rates.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No currencies added yet — prices only show in ₹ INR.
          </p>
        ) : (
          rates.map((rate) => (
            <div key={rate.id} className={`${DASHBOARD_CARD_CLASS} flex items-center justify-between p-4 text-sm`}>
              <span className="text-slate-600 dark:text-slate-300">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{rate.currencyCode}</span> (
                {rate.symbol}) — 1 INR = {rate.symbol}
                {Number(rate.rateFromInr).toFixed(4)}
              </span>
              <button
                onClick={() => handleDelete(rate.currencyCode)}
                disabled={loading}
                type="button"
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className={`${DASHBOARD_CARD_CLASS} flex flex-wrap items-end gap-3 p-5`}>
        <div>
          <label className={DASHBOARD_LABEL_CLASS}>Currency code</label>
          <input
            type="text"
            required
            maxLength={3}
            placeholder="USD"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
            className={`${DASHBOARD_INPUT_CLASS} !w-24 font-mono uppercase`}
          />
        </div>
        <div>
          <label className={DASHBOARD_LABEL_CLASS}>Symbol</label>
          <input
            type="text"
            required
            placeholder="$"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className={`${DASHBOARD_INPUT_CLASS} !w-20`}
          />
        </div>
        <div>
          <label className={DASHBOARD_LABEL_CLASS}>Rate (units per 1 INR)</label>
          <input
            type="number"
            required
            step="0.000001"
            min="0"
            placeholder="0.012"
            value={rateFromInr}
            onChange={(e) => setRateFromInr(e.target.value)}
            className={`${DASHBOARD_INPUT_CLASS} !w-36`}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save rate"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Example: if 1 INR ≈ 0.012 USD, enter currency code USD, symbol $, rate 0.012. You&apos;ll need to update these
        periodically — they don&apos;t update automatically.
      </p>
    </div>
  );
}
