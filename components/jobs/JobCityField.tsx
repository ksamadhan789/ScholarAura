"use client";

import { CURATED_CITIES } from "@/lib/locationConstants";

// City input for the admin/recruiter job forms. Suggests the curated city
// list (via <datalist>) but accepts any city; the server normalizes the
// spelling (e.g. "Bangalore" → "Bengaluru") before saving.
export function JobCityField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">City</label>
      <input
        type="text"
        list="job-city-options"
        placeholder="e.g. Bengaluru"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
      />
      <datalist id="job-city-options">
        {CURATED_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Used for the city filter on the Jobs page. Leave blank for fully remote jobs.
      </p>
    </div>
  );
}
