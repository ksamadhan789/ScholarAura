// How complete a learner's profile is, for the checklist on /dashboard/profile.
// Pure — built from the saved profile fields, so it's easy to test.

export type ProfileFields = {
  hasPhoto: boolean;
  phone: string | null;
  organization: string | null;
  userType: string | null;
  fieldOfStudy: string | null;
  jobRole: string | null;
  expertise: string | null;
  linkedinUrl: string | null;
  bio: string | null;
  hasResume: boolean;
};

export type ProfileCheck = { key: string; label: string; done: boolean; anchor: string };

const filled = (v: string | null) => !!v && v.trim().length > 0;

export function profileChecklist(p: ProfileFields): ProfileCheck[] {
  const checks: ProfileCheck[] = [
    { key: "photo", label: "Add a profile photo", done: p.hasPhoto, anchor: "photo" },
    { key: "phone", label: "Add your mobile number", done: filled(p.phone), anchor: "personal" },
    {
      key: "organization",
      label: p.userType === "COLLEGE_STUDENT" ? "Add your college or university" : "Add your organisation",
      done: filled(p.organization),
      anchor: "academic",
    },
  ];
  // Only asked of the people the form actually shows these fields to.
  if (p.userType === "COLLEGE_STUDENT") {
    checks.push({
      key: "fieldOfStudy",
      label: "Pick your field of study",
      done: filled(p.fieldOfStudy),
      anchor: "academic",
    });
  } else if (p.userType === "PROFESSIONAL") {
    checks.push({ key: "jobRole", label: "Pick your job role", done: filled(p.jobRole), anchor: "academic" });
  }
  if (p.userType !== "COLLEGE_STUDENT") {
    checks.push({
      key: "expertise",
      label: "Say what you're expert in",
      done: filled(p.expertise),
      anchor: "academic",
    });
  }
  checks.push(
    { key: "linkedin", label: "Link your LinkedIn", done: filled(p.linkedinUrl), anchor: "career" },
    { key: "bio", label: "Write a short bio", done: filled(p.bio), anchor: "career" },
    { key: "resume", label: "Upload your resume", done: p.hasResume, anchor: "resume" },
  );
  return checks;
}

/** Whole-number percentage of checklist items done. */
export function profileCompletionPercent(checks: ProfileCheck[]): number {
  if (checks.length === 0) return 100;
  return Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
}
