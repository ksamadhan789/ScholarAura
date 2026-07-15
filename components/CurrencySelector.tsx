"use client";

type Rate = { currencyCode: string; symbol: string; rateFromInr: string };

export function CurrencySelector({
  priceInInr,
  rates,
  value,
  onChange,
}: {
  priceInInr: number;
  rates: Rate[];
  value: string;
  onChange: (code: string) => void;
}) {
  if (rates.length === 0) return null;

  const selected = rates.find((r) => r.currencyCode === value);
  const converted = selected ? priceInInr * Number(selected.rateFromInr) : null;

  return (
    <div className="mb-3 flex items-center gap-2 text-sm">
      <label className="text-gray-600 dark:text-slate-400">Pay in:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <option value="INR">INR (₹)</option>
        {rates.map((r) => (
          <option key={r.currencyCode} value={r.currencyCode}>
            {r.currencyCode} ({r.symbol})
          </option>
        ))}
      </select>
      {converted !== null && (
        <span className="text-gray-500 dark:text-slate-400">
          ≈ {selected!.symbol}
          {converted.toFixed(2)}
        </span>
      )}
    </div>
  );
}
