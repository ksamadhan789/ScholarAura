import { describe, expect, it } from "vitest";
import { profileChecklist, profileCompletionPercent, type ProfileFields } from "@/lib/profileCompleteness";

const empty: ProfileFields = {
  hasPhoto: false,
  phone: null,
  organization: null,
  userType: null,
  fieldOfStudy: null,
  jobRole: null,
  expertise: null,
  linkedinUrl: null,
  bio: null,
  hasResume: false,
};

describe("profileChecklist", () => {
  it("asks students for a field of study and professionals for a job role", () => {
    const student = profileChecklist({ ...empty, userType: "COLLEGE_STUDENT" }).map((c) => c.key);
    expect(student).toContain("fieldOfStudy");
    expect(student).not.toContain("jobRole");
    const pro = profileChecklist({ ...empty, userType: "PROFESSIONAL" }).map((c) => c.key);
    expect(pro).toContain("jobRole");
    expect(pro).not.toContain("fieldOfStudy");
    expect(profileChecklist(empty).map((c) => c.key)).not.toContain("jobRole");
  });

  it("treats whitespace as empty", () => {
    const checks = profileChecklist({ ...empty, bio: "   ", phone: "98765 43210" });
    expect(checks.find((c) => c.key === "bio")?.done).toBe(false);
    expect(checks.find((c) => c.key === "phone")?.done).toBe(true);
  });
});

describe("profileCompletionPercent", () => {
  it("rounds the share of finished items", () => {
    expect(profileCompletionPercent(profileChecklist(empty))).toBe(0);
    const checks = profileChecklist({ ...empty, hasPhoto: true, hasResume: true });
    expect(profileCompletionPercent(checks)).toBe(Math.round((2 / checks.length) * 100));
    const full = profileChecklist({
      hasPhoto: true,
      phone: "1",
      organization: "x",
      userType: "PROFESSIONAL",
      fieldOfStudy: null,
      jobRole: "Engineer",
      expertise: "x",
      linkedinUrl: "https://linkedin.com/in/x",
      bio: "x",
      hasResume: true,
    });
    expect(profileCompletionPercent(full)).toBe(100);
  });
});
