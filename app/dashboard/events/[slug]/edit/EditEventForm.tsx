"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPE_LABELS, EVENT_FORMAT_OPTIONS, EVENT_AUDIENCE_OPTIONS } from "@/lib/eventLabels";
import { PeopleEditor } from "@/components/PeopleEditor";
import type { EventPerson } from "@/lib/eventPeople";

type FormState = {
  title: string;
  description: string;
  shortDescription: string;
  type: string;
  startDate: string;
  endDate: string;
  fee: string;
  seatsTotal: string;
  venueOrLink: string;
  format: string;
  city: string;
  audience: string;
  thumbnailUrl: string;
  brochureUrl: string;
  eligibility: string;
  registrationStartDate: string;
  registrationDeadline: string;
  resultDate: string;
  prizeDescription: string;
  prizeFirst: string;
  prizeSecond: string;
  prizeThird: string;
  certificateLogoUrl: string;
  people: EventPerson[];
  organizer: string;
  googleFormUrl: string;
  googleFormNameEntryId: string;
  googleFormEmailEntryId: string;
  googleFormEnrollmentEntryId: string;
  googleSheetId: string;
  attendanceRequired: boolean;
  minAttendancePercent: string;
  certificateEnabled: boolean;
  certificateType: string;
  googleSlidesTemplateId: string;
  certificateSignatoryName: string;
  certificateSignatoryTitle: string;
};

const CERTIFICATE_TYPES = ["PARTICIPATION", "COMPLETION", "APPRECIATION", "CUSTOM"];

export function EditEventForm({
  slug,
  webhookSecret,
  initial,
}: {
  slug: string;
  webhookSecret: string;
  initial: FormState;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sampleSending, setSampleSending] = useState(false);
  const [sampleMessage, setSampleMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleEmailSample() {
    setSampleSending(true);
    setSampleMessage(null);
    try {
      const res = await fetch(`/api/events/${slug}/certificate-sample`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSampleMessage({ text: data?.error ?? "Couldn't send the sample. Please try again.", isError: true });
        return;
      }
      setSampleMessage({ text: "Sample certificate sent to your email.", isError: false });
    } catch {
      setSampleMessage({ text: "Couldn't reach the server. Please try again.", isError: true });
    } finally {
      setSampleSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save changes. Please try again.");
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
    <main className="mx-auto max-w-[900px] px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Edit event</h1>

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
            placeholder="One-line tagline shown at the top of the event page"
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
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          >
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Audience</label>
          <select
            value={form.audience}
            onChange={(e) => set("audience", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          >
            {EVENT_AUDIENCE_OPTIONS.map(({ value, label }) => (
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Fee (₹, 0 for free)</label>
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
            <label className="mb-1 block text-sm font-medium">Total seats</label>
            <input
              type="number"
              min="1"
              required
              value={form.seatsTotal}
              onChange={(e) => set("seatsTotal", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Format</label>
          <select
            value={form.format}
            onChange={(e) => set("format", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          >
            {EVENT_FORMAT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {form.format !== "ONLINE" && (
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <input
              type="text"
              required
              placeholder="e.g. Mumbai"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Shown publicly and used for the location filter — the exact venue address stays hidden
              until someone registers.
            </p>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {form.format === "ONLINE" ? "Zoom link" : form.format === "HYBRID" ? "Venue address + Zoom link" : "Venue address"}
          </label>
          <input
            type="text"
            required
            value={form.venueOrLink}
            onChange={(e) => set("venueOrLink", e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
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
            Shown as the cover image on the event card. Landscape images work best.
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
            placeholder="e.g. D.Pharm & B.Pharm students"
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
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Shown alongside the ScholarAura logo on certificates issued for this event.
          </p>
        </div>

        <PeopleEditor people={form.people} onChange={(people) => set("people", people)} />

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h2 className="mb-3 font-semibold">Registration &amp; Google Form</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Organizer (optional)</label>
              <input
                type="text"
                value={form.organizer}
                onChange={(e) => set("organizer", e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Google Form URL (optional)</label>
              <input
                type="url"
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                value={form.googleFormUrl}
                onChange={(e) => set("googleFormUrl", e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Registrants are sent here after registering on our site.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Name field entry ID (optional)</label>
                <input
                  type="text"
                  placeholder="entry.123456"
                  value={form.googleFormNameEntryId}
                  onChange={(e) => set("googleFormNameEntryId", e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Email field entry ID (optional)</label>
                <input
                  type="text"
                  placeholder="entry.234567"
                  value={form.googleFormEmailEntryId}
                  onChange={(e) => set("googleFormEmailEntryId", e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Enrollment ID field entry ID (optional)</label>
                <input
                  type="text"
                  placeholder="entry.345678"
                  value={form.googleFormEnrollmentEntryId}
                  onChange={(e) => set("googleFormEnrollmentEntryId", e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Entry IDs let us prefill the form with the registrant's name/email/enrollment number —
              open the form, add each field, then use Google Forms' &ldquo;Get pre-filled link&rdquo; tool
              to find the <code>entry.NNNNNN</code> ID for each one. Leave blank to link to the form
              without prefilling.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium">Google Sheet ID (optional)</label>
              <input
                type="text"
                placeholder="The long ID in the response sheet's URL"
                value={form.googleSheetId}
                onChange={(e) => set("googleSheetId", e.target.value)}
                className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Share this sheet with our service account's email (view access) so attendance can be
                synced from it. Expected columns: <code>email</code>, <code>attendance</code> (0-100).
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Webhook secret</label>
              <input
                type="text"
                readOnly
                value={webhookSecret}
                onClick={(e) => e.currentTarget.select()}
                className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 font-mono text-xs dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Unique to this event — paste it as the <code>WEBHOOK_SECRET</code> script property in
                the Apps Script bound to this event&rsquo;s response sheet. Each event has its own, so
                access to one event&rsquo;s script can&rsquo;t be used to submit data for another event.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h2 className="mb-3 font-semibold">Attendance</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.attendanceRequired}
              onChange={(e) => set("attendanceRequired", e.target.checked)}
            />
            Require a minimum attendance percentage before issuing a certificate
          </label>
          {form.attendanceRequired && (
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium">Minimum attendance (%)</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.minAttendancePercent}
                onChange={(e) => set("minAttendancePercent", e.target.value)}
                className="w-full max-w-[8rem] rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h2 className="mb-3 font-semibold">Certificate</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="text-sm">
                Status:{" "}
                <strong
                  className={
                    form.certificateEnabled
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-slate-400"
                  }
                >
                  Automatic Certification is {form.certificateEnabled ? "ON" : "OFF"}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => set("certificateEnabled", !form.certificateEnabled)}
                className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Turn {form.certificateEnabled ? "OFF" : "ON"}
              </button>
            </div>
            {form.certificateEnabled && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Certificate type</label>
                  <select
                    value={form.certificateType}
                    onChange={(e) => set("certificateType", e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                  >
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Google Slides template ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="The long ID in the template's URL"
                    value={form.googleSlidesTemplateId}
                    onChange={(e) => set("googleSlidesTemplateId", e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                  />
                  {form.googleSlidesTemplateId && (
                    <a
                      href={`https://docs.google.com/presentation/d/${form.googleSlidesTemplateId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Preview template ↗
                    </a>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Design the certificate in Google Slides using placeholders{" "}
                    <code>{"{{NAME}}"}</code>, <code>{"{{EVENT_TITLE}}"}</code>,{" "}
                    <code>{"{{CERTIFICATE_NUMBER}}"}</code>, <code>{"{{DATE}}"}</code>,{" "}
                    <code>{"{{CERTIFICATE_TYPE}}"}</code>, <code>{"{{COLLEGE}}"}</code>,{" "}
                    <code>{"{{SIGNATORY_NAME}}"}</code> and <code>{"{{SIGNATORY_TITLE}}"}</code> — these
                    are the exact strings the certificate gets generated with, so a typo (extra space,
                    wrong case) means that spot won't fill in. Share the Slides file with our service
                    account's email (view access) and paste its ID here.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Signatory name (optional)
                    </label>
                    <input
                      type="text"
                      value={form.certificateSignatoryName}
                      onChange={(e) => set("certificateSignatoryName", e.target.value)}
                      className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Signatory title (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Director, Academics"
                      value={form.certificateSignatoryTitle}
                      onChange={(e) => set("certificateSignatoryTitle", e.target.value)}
                      className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleEmailSample}
                    disabled={!form.googleSlidesTemplateId || sampleSending}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
                  >
                    {sampleSending ? "Sending…" : "📧 Email me a sample"}
                  </button>
                  {!form.googleSlidesTemplateId && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      Set a template ID above first.
                    </p>
                  )}
                  {sampleMessage && (
                    <p
                      className={`mt-1 text-xs ${sampleMessage.isError ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                    >
                      {sampleMessage.text}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

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
