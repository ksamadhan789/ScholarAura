"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { upload } from "@vercel/blob/client";
import { stagedUploadPath } from "@/lib/stagedUpload";
import { FIELD_OF_STUDY_OPTIONS, JOB_ROLE_OPTIONS } from "@/lib/onboardingOptions";
import { MAX_UPLOAD_BYTES } from "@/lib/uploadValidation";
import { Avatar } from "@/components/Avatar";
import { ImageCropModal } from "@/components/ImageCropModal";

type Initial = {
  name: string;
  hasPhoto: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  userType: string | null;
  organization: string;
  fieldOfStudy: string;
  jobRole: string;
  expertise: string;
  linkedinUrl: string;
  bio: string;
  achievements: string;
  resumeName: string | null;
  idCardFileName: string | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}{" "}
        {optional && <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white";

export function EditProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial.firstName);
  const [middleName, setMiddleName] = useState(initial.middleName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone);
  const [organization, setOrganization] = useState(initial.organization);
  const [fieldOfStudy, setFieldOfStudy] = useState(initial.fieldOfStudy);
  const [jobRole, setJobRole] = useState(initial.jobRole);
  const [expertise, setExpertise] = useState(initial.expertise);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
  const [bio, setBio] = useState(initial.bio);
  const [achievements, setAchievements] = useState(initial.achievements);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [resumeName, setResumeName] = useState(initial.resumeName);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [idCardFileName, setIdCardFileName] = useState(initial.idCardFileName);
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const [idCardUploading, setIdCardUploading] = useState(false);
  const [idCardProgress, setIdCardProgress] = useState(0);

  const [hasPhoto, setHasPhoto] = useState(initial.hasPhoto);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error ?? "Couldn't delete your account. Please try again.");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Couldn't reach the server. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          middleName: middleName || undefined,
          lastName,
          phone: phone || "",
          organization: organization || "",
          fieldOfStudy: fieldOfStudy || "",
          jobRole: jobRole || "",
          expertise: expertise || "",
          linkedinUrl: linkedinUrl || "",
          bio: bio || "",
          achievements: achievements
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save your changes. Please try again.");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setResumeError(null);
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/account/resume", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setResumeError(data?.error ?? "Couldn't upload your resume. Please try again.");
        return;
      }
      const data = await res.json();
      setResumeName(data.resumeName);
      router.refresh();
    } catch {
      setResumeError("Couldn't reach the server. Please try again.");
    } finally {
      setResumeUploading(false);
    }
  }

  async function handleResumeRemove() {
    setResumeError(null);
    setResumeUploading(true);
    try {
      const res = await fetch("/api/account/resume", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setResumeError(data?.error ?? "Couldn't remove your resume. Please try again.");
        return;
      }
      setResumeName(null);
      router.refresh();
    } catch {
      setResumeError("Couldn't reach the server. Please try again.");
    } finally {
      setResumeUploading(false);
    }
  }

  async function handleIdCardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Checked here, before even attempting the upload, because an oversized
    // file doesn't reliably reach our own server-side size check — Vercel
    // drops a request body over its own platform limit first.
    if (file.size > MAX_UPLOAD_BYTES) {
      setIdCardError(
        `That file is ${(file.size / (1024 * 1024)).toFixed(1)}MB — your ID card must be under ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB. Try a lower-resolution photo or scan.`
      );
      return;
    }

    setIdCardError(null);
    setIdCardUploading(true);
    setIdCardProgress(0);
    try {
      const blob = await upload(await stagedUploadPath(file.name), file, {
        access: "private",
        handleUploadUrl: "/api/account/id-card/blob-upload",
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setIdCardProgress(percentage),
      });

      const res = await fetch("/api/account/id-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl: blob.url, fileName: file.name, mimeType: file.type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setIdCardError(data?.error ?? "Couldn't upload your ID card. Please try again.");
        return;
      }
      const data = await res.json();
      setIdCardFileName(data.idCardFileName);
      router.refresh();
    } catch {
      setIdCardError("Couldn't reach the server. Please try again.");
    } finally {
      setIdCardUploading(false);
    }
  }

  async function handleIdCardRemove() {
    setIdCardError(null);
    setIdCardUploading(true);
    try {
      const res = await fetch("/api/account/id-card", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setIdCardError(data?.error ?? "Couldn't remove your ID card. Please try again.");
        return;
      }
      setIdCardFileName(null);
      router.refresh();
    } catch {
      setIdCardError("Couldn't reach the server. Please try again.");
    } finally {
      setIdCardUploading(false);
    }
  }

  function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    setPendingPhotoFile(file);
  }

  async function handleCropConfirm(blob: Blob) {
    setPendingPhotoFile(null);
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", blob, "profile-photo.jpg");
      const res = await fetch("/api/account/photo", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPhotoError(data?.error ?? "Couldn't upload your photo. Please try again.");
        return;
      }
      setHasPhoto(true);
      setPhotoVersion((v) => v + 1);
      router.refresh();
    } catch {
      setPhotoError("Couldn't reach the server. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handlePhotoRemove() {
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const res = await fetch("/api/account/photo", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPhotoError(data?.error ?? "Couldn't remove your photo. Please try again.");
        return;
      }
      setHasPhoto(false);
      router.refresh();
    } catch {
      setPhotoError("Couldn't reach the server. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  }

  const showFieldOfStudy = initial.userType === "COLLEGE_STUDENT";
  const showJobRole = initial.userType === "PROFESSIONAL";
  const photoSrc = hasPhoto ? `/api/account/photo?v=${photoVersion}` : null;

  return (
    <div className="flex flex-col gap-6">
      <Section title="Profile photo">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={initial.name} src={photoSrc} size={128} />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600">
                {photoUploading ? "Uploading…" : hasPhoto ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelected}
                  disabled={photoUploading}
                  className="hidden"
                />
              </label>
              {hasPhoto && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  disabled={photoUploading}
                  className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              JPEG, PNG or WebP, up to 4MB. You&rsquo;ll be able to crop and adjust it before saving.
            </p>
            {photoError && <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>}
          </div>
        </div>
      </Section>

      {pendingPhotoFile && (
        <ImageCropModal
          file={pendingPhotoFile}
          onCancel={() => setPendingPhotoFile(null)}
          onCropped={handleCropConfirm}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Section title="Personal details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Last name">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                required
              />
            </Field>
          </div>
          <Field label="Middle name" optional>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Mobile number" optional>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section title="Academic / professional details">
          <Field label={showFieldOfStudy ? "College / university" : "Organization"} optional>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className={inputClass}
            />
          </Field>
          {showFieldOfStudy && (
            <Field label="Field of study" optional>
              <select
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a field</option>
                {FIELD_OF_STUDY_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {showJobRole && (
            <Field label="Job role" optional>
              <select value={jobRole} onChange={(e) => setJobRole(e.target.value)} className={inputClass}>
                <option value="">Select a role</option>
                {JOB_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Expert in" optional>
            <input
              type="text"
              placeholder="e.g. Pharmaceutical Chemistry, Machine Learning..."
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>

        <Section title="Career profile">
          <Field label="LinkedIn URL" optional>
            <input
              type="url"
              placeholder="https://www.linkedin.com/in/your-name"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="About / bio" optional>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="A short summary about yourself, your goals, and what you're looking for."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Achievements" optional>
            <input
              type="text"
              placeholder="Comma-separated, e.g. Dean's list 2024, Published research paper, Hackathon winner"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              className={inputClass}
            />
          </Field>
        </Section>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-600 dark:text-green-400">✅ Profile updated.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded bg-brand-600 px-5 py-2.5 text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>

      <Section title="Resume">
        {resumeName ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">📄 {resumeName}</p>
            <a
              href="/api/account/resume"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600"
            >
              View
            </a>
            <label className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600">
              {resumeUploading ? "Uploading…" : "Replace"}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleResumeRemove}
              disabled={resumeUploading}
              className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Upload a PDF resume once here, so it's ready to attach to job applications and share on
              your public profile.
            </p>
            <label className="inline-block w-fit cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-slate-600">
              {resumeUploading ? "Uploading…" : "Upload resume (PDF, max 4MB)"}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                disabled={resumeUploading}
                className="hidden"
              />
            </label>
          </div>
        )}
        {resumeError && <p className="text-sm text-red-600 dark:text-red-400">{resumeError}</p>}
      </Section>

      <Section title="Student ID card">
        {idCardFileName ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">🪪 {idCardFileName}</p>
            <a
              href="/api/account/id-card"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600"
            >
              View
            </a>
            <label className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-xs dark:border-slate-600">
              {idCardUploading ? `Uploading… ${idCardProgress}%` : "Replace"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleIdCardUpload}
                disabled={idCardUploading}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleIdCardRemove}
              disabled={idCardUploading}
              className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Upload a photo or scan of your student ID card once here, so it's ready whenever a
              competition needs it — no more pasting a Drive link for every entry.
            </p>
            <label className="inline-block w-fit cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-slate-600">
              {idCardUploading
                ? `Uploading… ${idCardProgress}%`
                : `Upload ID card (image or PDF, max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)`}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleIdCardUpload}
                disabled={idCardUploading}
                className="hidden"
              />
            </label>
          </div>
        )}
        {idCardError && <p className="text-sm text-red-600 dark:text-red-400">{idCardError}</p>}
      </Section>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/20">
        <h2 className="mb-1 font-semibold text-red-900 dark:text-red-300">Danger zone</h2>
        {!showDeleteConfirm ? (
          <>
            <p className="mb-3 text-sm text-red-700 dark:text-red-400">
              Deleting your account disables your login and removes your personal details. Your course,
              event and competition history stays on record, same as any platform.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Delete my account
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              This can&rsquo;t be undone from your side. You&rsquo;ll be signed out immediately and won&rsquo;t
              be able to log back in with this email.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-red-900 dark:text-red-300">
                Why are you leaving? (optional, helps us improve)
              </label>
              <textarea
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                disabled={deleting}
                className="w-full rounded border border-red-300 px-3 py-2 text-sm dark:border-red-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-red-900 dark:text-red-300">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
                className="w-full max-w-xs rounded border border-red-300 px-3 py-2 text-sm dark:border-red-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            {deleteError && <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE"}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Permanently delete my account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteReason("");
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
