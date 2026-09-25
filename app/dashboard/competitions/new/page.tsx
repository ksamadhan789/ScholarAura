"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeopleEditor } from "@/components/PeopleEditor";
import type { EventPerson } from "@/lib/eventPeople";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function NewCompetitionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [fee, setFee] = useState("0");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState("1");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");
  const [certificateLogoUrl, setCertificateLogoUrl] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [city, setCity] = useState("");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [people, setPeople] = useState<EventPerson[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          shortDescription: shortDescription || undefined,
          startDate,
          endDate,
          submissionDeadline,
          fee,
          prizeDescription: prizeDescription || undefined,
          prizeFirst: prizeFirst || undefined,
          prizeSecond: prizeSecond || undefined,
          prizeThird: prizeThird || undefined,
          maxTeamSize,
          thumbnailUrl: thumbnailUrl || undefined,
          brochureUrl: brochureUrl || undefined,
          certificateLogoUrl: certificateLogoUrl || undefined,
          eligibility: eligibility || undefined,
          city: city || undefined,
          registrationStartDate: registrationStartDate || undefined,
          registrationDeadline: registrationDeadline || undefined,
          resultDate: resultDate || undefined,
          people,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't create the competition. Please try again.");
        return;
      }

      router.push("/dashboard/competitions");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell narrow title="Create a competition" backHref="/dashboard/competitions" backLabel="Competitions">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Short description (optional)
          </label>
          <input
            type="text"
            placeholder="One-line tagline shown at the top of the competition page"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Start</label>
            <input
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">End</label>
            <input
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Submission deadline
          </label>
          <input
            type="datetime-local"
            required
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Entry fee (₹, 0 for free)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Max team size</label>
            <input
              type="number"
              min="1"
              required
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">1 = individual entries only</p>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Thumbnail URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Shown as the cover image on the competition card. Landscape images work best.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Brochure URL (optional)
          </label>
          <input
            type="url"
            value={brochureUrl}
            onChange={(e) => setBrochureUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Who can participate (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Bonafide D.Pharmacy students"
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            City{" "}
            <span className="font-normal text-slate-400 dark:text-slate-500">
              (optional — leave blank for online/remote)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Pune"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Registration opens (optional)
            </label>
            <input
              type="datetime-local"
              value={registrationStartDate}
              onChange={(e) => setRegistrationStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Registration deadline (optional)
            </label>
            <input
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Result date (optional)
            </label>
            <input
              type="datetime-local"
              value={resultDate}
              onChange={(e) => setResultDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Prizes (optional)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="1st prize"
              value={prizeFirst}
              onChange={(e) => setPrizeFirst(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="2nd prize"
              value={prizeSecond}
              onChange={(e) => setPrizeSecond(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="3rd prize"
              value={prizeThird}
              onChange={(e) => setPrizeThird(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Additional prize notes (optional)"
            value={prizeDescription}
            onChange={(e) => setPrizeDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Collaborating institute logo URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={certificateLogoUrl}
            onChange={(e) => setCertificateLogoUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <PeopleEditor people={people} onChange={setPeople} />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create competition (as draft)"}
        </button>
      </form>
    </DashboardShell>
  );
}
