"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPE_LABELS } from "@/lib/eventLabels";

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("NATIONAL_CONFERENCE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fee, setFee] = useState("0");
  const [seatsTotal, setSeatsTotal] = useState("50");
  const [isOnline, setIsOnline] = useState(true);
  const [venueOrLink, setVenueOrLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          startDate,
          endDate,
          fee,
          seatsTotal,
          isOnline,
          venueOrLink,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't create the event. Please try again.");
        return;
      }

      router.push("/dashboard/events");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Create an event</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Start</label>
            <input
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End</label>
            <input
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Fee (₹, 0 for free)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Total seats</label>
            <input
              type="number"
              min="1"
              required
              value={seatsTotal}
              onChange={(e) => setSeatsTotal(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isOnline}
            onChange={(e) => setIsOnline(e.target.checked)}
          />
          This is an online event (Zoom)
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {isOnline ? "Zoom link" : "Venue address"}
          </label>
          <input
            type="text"
            required
            placeholder={isOnline ? "https://zoom.us/j/..." : "Room / building / city"}
            value={venueOrLink}
            onChange={(e) => setVenueOrLink(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Only shown to attendees after they register.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create event (as draft)"}
        </button>
      </form>
    </main>
  );
}
