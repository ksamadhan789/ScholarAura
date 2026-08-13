"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIELD_OF_STUDY_OPTIONS, JOB_ROLE_OPTIONS } from "@/lib/onboardingOptions";

const USER_TYPES = [
  { value: "SCHOOL_STUDENT", label: "🎒 School Student" },
  { value: "COLLEGE_STUDENT", label: "🎓 College Student" },
  { value: "FRESHER", label: "💼 Fresher" },
  { value: "PROFESSIONAL", label: "👔 Professional" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<string | null>(null);
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [expertise, setExpertise] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please add your first and last name.");
      return;
    }
    if (!phone.trim() || !userType) {
      setError("Please add your mobile number and select what best describes you.");
      return;
    }
    if (userType === "COLLEGE_STUDENT" && !fieldOfStudy) {
      setError("Please select your field of study.");
      return;
    }
    if (userType === "PROFESSIONAL" && !jobRole) {
      setError("Please select your job role.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          middleName: middleName || undefined,
          lastName,
          phone,
          userType,
          fieldOfStudy: userType === "COLLEGE_STUDENT" ? fieldOfStudy : undefined,
          jobRole: userType === "PROFESSIONAL" ? jobRole : undefined,
          expertise: expertise || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skip: true }),
      });
    } finally {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const showExpertise = userType === "COLLEGE_STUDENT" || userType === "PROFESSIONAL";

  return (
    <main className="mx-auto flex flex-1 w-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">👋 Just one more step</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
        Help us tailor ScholarAura to you.
      </p>

      <form onSubmit={handleContinue} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Middle name (optional)</label>
          <input
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mobile number</label>
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">You are a...</label>
          <div className="grid grid-cols-2 gap-2">
            {USER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setUserType(t.value)}
                className={`rounded-full border px-4 py-2.5 text-sm transition-colors ${
                  userType === t.value
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {userType === "COLLEGE_STUDENT" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Field of study</label>
            <select
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a field</option>
              {FIELD_OF_STUDY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}

        {userType === "PROFESSIONAL" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Job role</label>
            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a role</option>
              {JOB_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {showExpertise && (
          <div>
            <label className="mb-1 block text-sm font-medium">Expert in (optional)</label>
            <input
              type="text"
              placeholder="e.g. Pharmaceutical Chemistry, Machine Learning..."
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2.5 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="text-sm text-gray-500 dark:text-slate-400 underline disabled:opacity-50"
        >
          Skip for now
        </button>
      </form>
    </main>
  );
}
