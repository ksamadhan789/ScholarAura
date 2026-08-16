"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FIELD_OF_STUDY_OPTIONS, JOB_ROLE_OPTIONS, COLLEGE_TYPE_OPTIONS } from "@/lib/onboardingOptions";

type CollegeSuggestion = { name: string; city: string | null; state: string | null };

const USER_TYPES = [
  { value: "COLLEGE_STUDENT", label: "🎓 College Student" },
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
  const [fieldOfStudyOther, setFieldOfStudyOther] = useState("");
  const [organization, setOrganization] = useState("");
  const [collegeSuggestions, setCollegeSuggestions] = useState<CollegeSuggestion[]>([]);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [addingNewCollege, setAddingNewCollege] = useState(false);
  const [collegeCity, setCollegeCity] = useState("");
  const [collegeState, setCollegeState] = useState("");
  const [collegeUniversity, setCollegeUniversity] = useState("");
  const [collegeType, setCollegeType] = useState("");
  const [collegeTypeOther, setCollegeTypeOther] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobRoleOther, setJobRoleOther] = useState("");
  const [expertise, setExpertise] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userType !== "COLLEGE_STUDENT" || !organization.trim()) {
      setCollegeSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/colleges?q=${encodeURIComponent(organization.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setCollegeSuggestions(data.colleges ?? []);
        }
      } catch {
        // Ignore — suggestions are a nice-to-have, not required to submit.
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [organization, userType]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError("Please agree to the Privacy Policy and Terms of Use to continue.");
      return;
    }
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
    if (userType === "COLLEGE_STUDENT" && fieldOfStudy === "Other" && !fieldOfStudyOther.trim()) {
      setError("Please tell us your field of study.");
      return;
    }
    if (userType === "COLLEGE_STUDENT" && !organization.trim()) {
      setError("Please add your college name.");
      return;
    }
    const isKnownCollege = collegeSuggestions.some(
      (c) => c.name.toLowerCase() === organization.trim().toLowerCase()
    );
    if (userType === "COLLEGE_STUDENT" && !isKnownCollege && !addingNewCollege) {
      setError('Please select your college from the suggestions, or click "Add it manually" if it isn\'t listed.');
      return;
    }
    if (userType === "COLLEGE_STUDENT" && addingNewCollege) {
      if (!collegeCity.trim() || !collegeState.trim() || !collegeUniversity.trim() || !collegeType) {
        setError("Please fill in your college's city, state, and university/board.");
        return;
      }
      if (collegeType === "Other" && !collegeTypeOther.trim()) {
        setError("Please tell us your college type.");
        return;
      }
    }
    if (userType === "PROFESSIONAL" && !jobRole) {
      setError("Please select your job role.");
      return;
    }
    if (userType === "PROFESSIONAL" && jobRole === "Other" && !jobRoleOther.trim()) {
      setError("Please tell us your job role.");
      return;
    }

    const resolvedFieldOfStudy =
      fieldOfStudy === "Other" ? fieldOfStudyOther.trim() : fieldOfStudy;
    const resolvedJobRole = jobRole === "Other" ? jobRoleOther.trim() : jobRole;
    const resolvedCollegeType =
      collegeType === "Other" ? collegeTypeOther.trim() : collegeType;

    setLoading(true);
    try {
      const res = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreedToTerms,
          marketingOptIn,
          firstName,
          middleName: middleName || undefined,
          lastName,
          phone,
          userType,
          fieldOfStudy: userType === "COLLEGE_STUDENT" ? resolvedFieldOfStudy : undefined,
          organization: userType === "COLLEGE_STUDENT" ? organization.trim() : undefined,
          collegeCity:
            userType === "COLLEGE_STUDENT" && addingNewCollege ? collegeCity.trim() : undefined,
          collegeState:
            userType === "COLLEGE_STUDENT" && addingNewCollege ? collegeState.trim() : undefined,
          collegeUniversity:
            userType === "COLLEGE_STUDENT" && addingNewCollege
              ? collegeUniversity.trim()
              : undefined,
          collegeType:
            userType === "COLLEGE_STUDENT" && addingNewCollege ? resolvedCollegeType : undefined,
          jobRole: userType === "PROFESSIONAL" ? resolvedJobRole : undefined,
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
            {fieldOfStudy === "Other" && (
              <input
                type="text"
                placeholder="Tell us your field of study"
                value={fieldOfStudyOther}
                onChange={(e) => setFieldOfStudyOther(e.target.value)}
                className="mt-2 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            )}
          </div>
        )}

        {userType === "COLLEGE_STUDENT" && (
          <div className="relative">
            <label className="mb-1 block text-sm font-medium">College name</label>
            <input
              type="text"
              placeholder="Start typing your college name..."
              value={organization}
              onChange={(e) => {
                setOrganization(e.target.value);
                setShowCollegeSuggestions(true);
                setAddingNewCollege(false);
              }}
              onFocus={() => setShowCollegeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 150)}
              className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
            {showCollegeSuggestions && organization.trim() && (
              <div className="absolute z-10 mt-1 w-full rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                {collegeSuggestions.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onMouseDown={() => {
                      setOrganization(c.name);
                      setShowCollegeSuggestions(false);
                      setAddingNewCollege(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    {c.name}
                    {(c.city || c.state) && (
                      <span className="text-gray-500 dark:text-slate-400">
                        {" — "}
                        {[c.city, c.state].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </button>
                ))}
                {!collegeSuggestions.some(
                  (c) => c.name.toLowerCase() === organization.trim().toLowerCase()
                ) && (
                  <button
                    type="button"
                    onMouseDown={() => {
                      setAddingNewCollege(true);
                      setShowCollegeSuggestions(false);
                    }}
                    className="block w-full border-t border-gray-200 dark:border-slate-700 px-3 py-2 text-left text-sm text-brand-600 dark:text-brand-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Can&rsquo;t find it? Add &ldquo;{organization.trim()}&rdquo; manually
                  </button>
                )}
              </div>
            )}
            {addingNewCollege && (
              <div className="mt-2 flex flex-col gap-2 rounded border border-gray-200 dark:border-slate-700 p-3">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  This college will be added once ScholarAura reviews it. Tell us a bit more so we can
                  verify it:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={collegeCity}
                    onChange={(e) => setCollegeCity(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={collegeState}
                    onChange={(e) => setCollegeState(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="University / Board"
                  value={collegeUniversity}
                  onChange={(e) => setCollegeUniversity(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                />
                <select
                  value={collegeType}
                  onChange={(e) => setCollegeType(e.target.value)}
                  className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                >
                  <option value="">College type</option>
                  {COLLEGE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {collegeType === "Other" && (
                  <input
                    type="text"
                    placeholder="Tell us your college type"
                    value={collegeTypeOther}
                    onChange={(e) => setCollegeTypeOther(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
                  />
                )}
              </div>
            )}
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
            {jobRole === "Other" && (
              <input
                type="text"
                placeholder="Tell us your job role"
                value={jobRoleOther}
                onChange={(e) => setJobRoleOther(e.target.value)}
                className="mt-2 w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            )}
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

        <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-slate-700 pt-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-gray-600 dark:text-slate-400">
              All your information is collected, stored and processed as per our data processing
              guidelines. By continuing, you agree to our{" "}
              <Link href="/privacy" target="_blank" className="text-brand-600 underline dark:text-brand-400">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" target="_blank" className="text-brand-600 underline dark:text-brand-400">
                Terms of Use
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-gray-600 dark:text-slate-400">
              Stay in the loop — get relevant updates about new courses, events and competitions curated
              just for <em>you</em>!
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2.5 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
