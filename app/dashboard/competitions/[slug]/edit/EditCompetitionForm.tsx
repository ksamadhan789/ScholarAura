"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeopleEditor } from "@/components/PeopleEditor";
import type { EventPerson } from "@/lib/eventPeople";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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
  city: string;
  registrationStartDate: string;
  registrationDeadline: string;
  resultDate: string;
  people: EventPerson[];
  organizer: string;
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

export function EditCompetitionForm({ slug, initial }: { slug: string; initial: FormState }) {
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
      const res = await fetch(`/api/competitions/${slug}/certificate-sample`, { method: "POST" });
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
    <DashboardShell narrow title="Edit competition" backHref="/dashboard/competitions" backLabel="Competitions">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
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
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Start</label>
            <input
              type="datetime-local"
              required
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">End</label>
            <input
              type="datetime-local"
              required
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
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
            value={form.submissionDeadline}
            onChange={(e) => set("submissionDeadline", e.target.value)}
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
              value={form.fee}
              onChange={(e) => set("fee", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Max team size</label>
            <input
              type="number"
              min="1"
              required
              value={form.maxTeamSize}
              onChange={(e) => set("maxTeamSize", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Thumbnail URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={form.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
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
            value={form.brochureUrl}
            onChange={(e) => set("brochureUrl", e.target.value)}
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
            value={form.eligibility}
            onChange={(e) => set("eligibility", e.target.value)}
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
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
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
              value={form.registrationStartDate}
              onChange={(e) => set("registrationStartDate", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Registration deadline (optional)
            </label>
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => set("registrationDeadline", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Result date (optional)
            </label>
            <input
              type="datetime-local"
              value={form.resultDate}
              onChange={(e) => set("resultDate", e.target.value)}
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
              value={form.prizeFirst}
              onChange={(e) => set("prizeFirst", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="2nd prize"
              value={form.prizeSecond}
              onChange={(e) => set("prizeSecond", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="3rd prize"
              value={form.prizeThird}
              onChange={(e) => set("prizeThird", e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Additional prize notes (optional)"
            value={form.prizeDescription}
            onChange={(e) => set("prizeDescription", e.target.value)}
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
            value={form.certificateLogoUrl}
            onChange={(e) => set("certificateLogoUrl", e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <PeopleEditor people={form.people} onChange={(people) => set("people", people)} />

        <div className="border-t border-slate-100 pt-5 dark:border-slate-700">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Organizer &amp; attendance</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Organizer (optional)
              </label>
              <input
                type="text"
                value={form.organizer}
                onChange={(e) => set("organizer", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Google Sheet ID (optional)
              </label>
              <input
                type="text"
                placeholder="The long ID in the attendance sheet's URL"
                value={form.googleSheetId}
                onChange={(e) => set("googleSheetId", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Share this sheet with our service account's email (view access) so attendance can be synced from it.
                Expected columns: <code>email</code>, <code>attendance</code> (0-100).
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 dark:border-slate-700">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Attendance</h2>
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Minimum attendance (%)
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.minAttendancePercent}
                onChange={(e) => set("minAttendancePercent", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white !max-w-[8rem]"
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-5 dark:border-slate-700">
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Certificate</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40">
              <span className="text-sm">
                Status:{" "}
                <strong
                  className={
                    form.certificateEnabled
                      ? "text-green-600 dark:text-green-400"
                      : "text-slate-500 dark:text-slate-400"
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
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Certificate type
                  </label>
                  <select
                    value={form.certificateType}
                    onChange={(e) => set("certificateType", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Google Slides template ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="The long ID in the template's URL"
                    value={form.googleSlidesTemplateId}
                    onChange={(e) => set("googleSlidesTemplateId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
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
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Design the certificate in Google Slides using placeholders <code>{"{{NAME}}"}</code>,{" "}
                    <code>{"{{EVENT_TITLE}}"}</code>, <code>{"{{CERTIFICATE_NUMBER}}"}</code>, <code>{"{{DATE}}"}</code>
                    , <code>{"{{CERTIFICATE_TYPE}}"}</code>, <code>{"{{COLLEGE}}"}</code>,{" "}
                    <code>{"{{SIGNATORY_NAME}}"}</code> and <code>{"{{SIGNATORY_TITLE}}"}</code> — these are the exact
                    strings the certificate gets generated with, so a typo (extra space, wrong case) means that spot
                    won't fill in. Share the Slides file with our service account's email (view access) and paste its ID
                    here.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Signatory name (optional)
                    </label>
                    <input
                      type="text"
                      value={form.certificateSignatoryName}
                      onChange={(e) => set("certificateSignatoryName", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Signatory title (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Director, Academics"
                      value={form.certificateSignatoryTitle}
                      onChange={(e) => set("certificateSignatoryTitle", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleEmailSample}
                    disabled={!form.googleSlidesTemplateId || sampleSending}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {sampleSending ? "Sending…" : "Email me a sample"}
                  </button>
                  {!form.googleSlidesTemplateId && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Set a template ID above first.</p>
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
          className="self-start rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </DashboardShell>
  );
}
