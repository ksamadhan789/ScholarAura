"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateCouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [appliesTo, setAppliesTo] = useState("ALL");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          appliesTo,
          maxRedemptions: maxRedemptions || null,
          minAmount: minAmount || null,
          expiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't create coupon.");
        return;
      }
      setCode("");
      setDiscountValue("");
      setMaxRedemptions("");
      setMinAmount("");
      setExpiresAt("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 rounded border border-gray-200 dark:border-slate-700 p-4">
      <h2 className="font-semibold">Create a coupon</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Code</label>
          <input
            type="text"
            required
            placeholder="WELCOME20"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm uppercase dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          >
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount off (₹)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {discountType === "PERCENT" ? "Percent (0-100)" : "Amount (₹)"}
          </label>
          <input
            type="number"
            required
            min="0"
            max={discountType === "PERCENT" ? "100" : undefined}
            step="0.01"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Applies to</label>
          <select
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          >
            <option value="ALL">Everything</option>
            <option value="COURSE">Courses only</option>
            <option value="EVENT">Events only</option>
            <option value="COMPETITION">Competitions only</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Max redemptions (optional)</label>
          <input
            type="number"
            min="1"
            placeholder="Unlimited"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Minimum order (₹, optional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Expires (optional)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create coupon"}
      </button>
    </form>
  );
}
