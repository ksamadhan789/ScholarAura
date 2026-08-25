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

export function EditCompetitionForm({
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
                Entrants are sent here after entering on our site.
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
              Entry IDs let us prefill the form with the entrant&apos;s name/email/enrollment number —
              open the form, add each field, then use Google Forms&apos; &ldquo;Get pre-filled link&rdquo; tool
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
                Unique to this competition — paste it as the <code>WEBHOOK_SECRET</code> script property
                in the Apps Script bound to this competition&rsquo;s response sheet. Each competition has
                its own, so access to one competition&rsquo;s script can&rsquo;t be used to submit data for
                another.
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.certificateEnabled}
                onChange={(e) => set("certificateEnabled", e.target.checked)}
              />
              Issue certificates for this competition
            </label>
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Design the certificate in Google Slides using placeholders like{" "}
                    <code>{"{{NAME}}"}</code>, <code>{"{{EVENT_TITLE}}"}</code>,{" "}
                    <code>{"{{CERTIFICATE_NUMBER}}"}</code>, then share it with our service account's
                    email (view access) and paste its ID here.
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
