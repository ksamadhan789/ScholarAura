"use client";

import { CURATED_CITIES } from "@/lib/locationConstants";

// City input for the admin/recruiter job forms. Suggests the curated city
// list (via <datalist>) but accepts any city; the server normalizes the
// spelling (e.g. "Bangalore" → "Bengaluru") before saving.
export function JobCityField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">City</label>
      <input
        type="text"
        list="job-city-options"
        placeholder="e.g. Bengaluru"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
      />
      <datalist id="job-city-options">
        {CURATED_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
        Used for the city filter on the Jobs page. Leave blank for fully remote jobs.
      </p>
    </div>
  );
}
