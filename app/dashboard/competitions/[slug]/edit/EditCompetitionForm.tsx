"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeopleEditor } from "@/components/PeopleEditor";
import type { EventPerson } from "@/lib/eventPeople";

type FormState = {
  title: string;
  description: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  fee: string;
  prizeDescription: string;
  prizeFirst: string;
  prizeSecond: string;
  prizeThird: string;
  maxTeamSize: string;
  thumbnailUrl: string;
  brochureUrl: string;
  certificateLogoUrl: string;
  eligibility: string;
  registrationStartDate: string;
  registrationDeadline: string;
  resultDate: string;
  people: EventPerson[];
};

export function EditCompetitionForm({ slug, initial }: { slug: string; initial: FormState }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/competitions/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save changes. Please try again.");
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
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Edit competition</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Short description (optional)</label>
          <input
            type="text"
            placeholder="One-line tagline shown at the top of the competition page"
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Start</label>
            <input
              type="datetime-local"
              required
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End</label>
            <input
              type="datetime-local"
              required
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Submission deadline</label>
          <input
            type="datetime-local"
            required
            value={form.submissionDeadline}
            onChange={(e) => set("submissionDeadline", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Entry fee (₹, 0 for free)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.fee}
              onChange={(e) => set("fee", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Max team size</label>
            <input
              type="number"
              min="1"
              required
              value={form.maxTeamSize}
              onChange={(e) => set("maxTeamSize", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Thumbnail URL (optional)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Shown as the cover image on the competition card. Landscape images work best.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Brochure URL (optional)</label>
          <input
            type="url"
            value={form.brochureUrl}
            onChange={(e) => set("brochureUrl", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Who can participate (optional)</label>
          <input
            type="text"
            placeholder="e.g. Bonafide D.Pharmacy students"
            value={form.eligibility}
            onChange={(e) => set("eligibility", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Registration opens (optional)</label>
            <input
              type="datetime-local"
              value={form.registrationStartDate}
              onChange={(e) => set("registrationStartDate", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Registration deadline (optional)</label>
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => set("registrationDeadline", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Result date (optional)</label>
            <input
              type="datetime-local"
              value={form.resultDate}
              onChange={(e) => set("resultDate", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Prizes (optional)</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="🥇 1st prize"
              value={form.prizeFirst}
              onChange={(e) => set("prizeFirst", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="🥈 2nd prize"
              value={form.prizeSecond}
              onChange={(e) => set("prizeSecond", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="🥉 3rd prize"
              value={form.prizeThird}
              onChange={(e) => set("prizeThird", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Additional prize notes (optional)"
            value={form.prizeDescription}
            onChange={(e) => set("prizeDescription", e.target.value)}
            className="mt-2 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Collaborating institute logo URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={form.certificateLogoUrl}
            onChange={(e) => set("certificateLogoUrl", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <PeopleEditor people={form.people} onChange={(people) => set("people", people)} />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}
