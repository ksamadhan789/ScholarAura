"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMPLOYMENT_TYPE_LABELS, INTERNSHIP_PERKS } from "@/lib/jobLabels";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [minExperienceYears, setMinExperienceYears] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [stipendRange, setStipendRange] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [internshipStartDate, setInternshipStartDate] = useState("");
  const [perks, setPerks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isInternship = employmentType === "INTERNSHIP";

  function togglePerk(perk: string) {
    setPerks((prev) => (prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          companyName,
          companyLogoUrl: companyLogoUrl || undefined,
          location,
          isRemote,
          employmentType,
          description,
          requirements: requirements || undefined,
          minExperienceYears: minExperienceYears || undefined,
          salaryRange: salaryRange || undefined,
          applicationDeadline: applicationDeadline || undefined,
          stipendRange: isInternship ? stipendRange || undefined : undefined,
          durationMonths: isInternship && durationMonths ? durationMonths : undefined,
          internshipStartDate: isInternship ? internshipStartDate || undefined : undefined,
          perks: isInternship && perks.length > 0 ? perks : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't create the job. Please try again.");
        return;
      }

      router.push("/dashboard/jobs");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Post a job</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Job title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Company name</label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Company logo URL (optional)</label>
          <input
            type="url"
            placeholder="https://..."
            value={companyLogoUrl}
            onChange={(e) => setCompanyLogoUrl(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Location</label>
            <input
              type="text"
              required
              placeholder="City, Country"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Employment type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            >
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} />
          This role is remote
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Requirements <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Min. experience (years){" "}
              <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              value={minExperienceYears}
              onChange={(e) => setMinExperienceYears(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Salary range <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ₹6-9 LPA"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Application deadline{" "}
            <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <input
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {isInternship && (
          <div className="flex flex-col gap-4 rounded border border-gray-200 dark:border-slate-700 p-4">
            <p className="text-sm font-medium">Internship details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Stipend <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹10,000/month, or Unpaid"
                  value={stipendRange}
                  onChange={(e) => setStipendRange(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Duration (months) <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Start date{" "}
                <span className="font-normal text-gray-400 dark:text-slate-500">
                  (optional — leave blank for &quot;Immediately&quot;)
                </span>
              </label>
              <input
                type="date"
                value={internshipStartDate}
                onChange={(e) => setInternshipStartDate(e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Perks</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {INTERNSHIP_PERKS.map((perk) => (
                  <label key={perk} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={perks.includes(perk)}
                      onChange={() => togglePerk(perk)}
                    />
                    {perk}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create job (as draft)"}
        </button>
      </form>
    </main>
  );
}
