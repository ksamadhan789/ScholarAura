"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
          <p className="text-sm text-gray-500 dark:text-slate-400">
            No currencies added yet — prices only show in ₹ INR.
          </p>
        ) : (
          rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm dark:border-slate-700"
            >
              <span>
                {rate.currencyCode} ({rate.symbol}) — 1 INR = {rate.symbol}
                {Number(rate.rateFromInr).toFixed(4)}
              </span>
              <button
                onClick={() => handleDelete(rate.currencyCode)}
                disabled={loading}
                className="text-red-600 hover:underline dark:text-red-400"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 rounded border border-gray-200 p-4 dark:border-slate-700"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Currency code</label>
          <input
            type="text"
            required
            maxLength={3}
            placeholder="USD"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
            className="w-24 rounded border border-gray-300 px-3 py-2 uppercase dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Symbol</label>
          <input
            type="text"
            required
            placeholder="$"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-20 rounded border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Rate (units per 1 INR)
          </label>
          <input
            type="number"
            required
            step="0.000001"
            min="0"
            placeholder="0.012"
            value={rateFromInr}
            onChange={(e) => setRateFromInr(e.target.value)}
            className="w-36 rounded border border-gray-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save rate"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Example: if 1 INR ≈ 0.012 USD, enter currency code USD, symbol $, rate 0.012.
        You&apos;ll need to update these periodically — they don&apos;t update automatically.
      </p>
    </div>
  );
}
