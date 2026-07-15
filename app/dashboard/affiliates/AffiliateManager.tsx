"use client";

import { useState } from "react";
import { DEFAULT_REFERRAL_RATE_PERCENT } from "@/lib/referralConstants";

type FoundUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isAffiliate: boolean;
  affiliateRatePercent: number | null;
  creditBalance: string;
  referralCode: string | null;
};

export function AffiliateManager() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<FoundUser | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [rate, setRate] = useState(String(DEFAULT_REFERRAL_RATE_PERCENT));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setUser(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "User not found");
        return;
      }
      const data: FoundUser = await res.json();
      setUser(data);
      setIsAffiliate(data.isAffiliate);
      setRate(String(data.affiliateRatePercent ?? DEFAULT_REFERRAL_RATE_PERCENT));
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/affiliate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAffiliate,
          affiliateRatePercent: isAffiliate ? Number(rate) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save changes.");
        return;
      }
      setMessage("Saved.");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded border border-gray-300 dark:border-slate-600 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {user && (
        <div className="rounded border border-gray-200 dark:border-slate-700 p-4">
          <p className="font-medium">
            {user.name} <span className="text-gray-500 dark:text-slate-400">· {user.email}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Role: {user.role} · Credit balance: ₹{Number(user.creditBalance).toFixed(2)} ·
            Referral code: {user.referralCode ?? "—"}
          </p>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAffiliate}
              onChange={(e) => setIsAffiliate(e.target.checked)}
            />
            Approved affiliate (custom commission rate)
          </label>

          {isAffiliate && (
            <div className="mt-2">
              <label className="mb-1 block text-sm font-medium">Commission rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-32 rounded border border-gray-300 dark:border-slate-600 px-3 py-2"
              />
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-4 rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Save
          </button>
          {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
        </div>
      )}
    </div>
  );
}
