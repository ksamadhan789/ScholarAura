import { describe, expect, it } from "vitest";
import { buildJobPostingSchema, serializeJsonLd } from "@/lib/jobPostingSchema";

const now = new Date("2026-09-24T00:00:00Z");
const base = {
  slug: "data-analyst-intern",
  title: "Data Analyst Intern",
  companyName: "Zomato",
  companyLogoUrl: "https://example.com/logo.png",
  location: "Gurgaon, Haryana",
  city: "Gurugram",
  isRemote: false,
  employmentType: "INTERNSHIP",
  description: "Analyse data.\nBuild dashboards.",
  requirements: null,
  minExperienceYears: null,
  applicationDeadline: new Date("2026-10-15T00:00:00Z"),
  isPublished: true,
  approvalStatus: "APPROVED",
  createdAt: new Date("2026-09-20T00:00:00Z"),
};

describe("buildJobPostingSchema", () => {
  it("maps a published, approved job to Google's JobPosting fields", () => {
    const schema = buildJobPostingSchema(base, "https://scholaraura.com", now)!;
    expect(schema).toMatchObject({
      "@type": "JobPosting",
      title: "Data Analyst Intern",
      description: "Analyse data.<br>Build dashboards.",
      datePosted: "2026-09-20T00:00:00.000Z",
      validThrough: "2026-10-15T00:00:00.000Z",
      employmentType: "INTERN",
      hiringOrganization: { "@type": "Organization", name: "Zomato", logo: "https://example.com/logo.png" },
      jobLocation: { address: { addressLocality: "Gurugram", addressCountry: "IN" } },
      url: "https://scholaraura.com/jobs/data-analyst-intern",
    });
    expect(schema).not.toHaveProperty("jobLocationType");
  });

  it("marks remote jobs as telecommute for applicants in India", () => {
    const schema = buildJobPostingSchema({ ...base, isRemote: true }, "https://x.com", now)!;
    expect(schema.jobLocationType).toBe("TELECOMMUTE");
    expect(schema.applicantLocationRequirements).toEqual({ "@type": "Country", name: "India" });
    expect(schema).not.toHaveProperty("jobLocation");
  });

  it("falls back to the free-text location when no city is set", () => {
    const schema = buildJobPostingSchema({ ...base, city: null }, "https://x.com", now)!;
    expect((schema.jobLocation as { address: { addressLocality: string } }).address.addressLocality).toBe(
      "Gurgaon, Haryana"
    );
  });

  it("escapes HTML in recruiter text and appends requirements", () => {
    const schema = buildJobPostingSchema(
      { ...base, description: "Use <b>SQL</b> & Python", requirements: "1 year exp" },
      "https://x.com",
      now
    )!;
    expect(schema.description).toBe(
      "Use &lt;b&gt;SQL&lt;/b&gt; &amp; Python<br><br><strong>Requirements</strong><br>1 year exp"
    );
  });

  it("adds experience in months only when some is required", () => {
    expect(buildJobPostingSchema({ ...base, minExperienceYears: 2 }, "https://x.com", now)).toMatchObject({
      experienceRequirements: { monthsOfExperience: 24 },
    });
    expect(buildJobPostingSchema({ ...base, minExperienceYears: 0 }, "https://x.com", now)).not.toHaveProperty(
      "experienceRequirements"
    );
  });

  it("returns null for drafts, unapproved and expired jobs", () => {
    expect(buildJobPostingSchema({ ...base, isPublished: false }, "https://x.com", now)).toBeNull();
    expect(buildJobPostingSchema({ ...base, approvalStatus: "PENDING" }, "https://x.com", now)).toBeNull();
    expect(
      buildJobPostingSchema({ ...base, applicationDeadline: new Date("2026-09-01T00:00:00Z") }, "https://x.com", now)
    ).toBeNull();
  });

  it("keeps jobs with no deadline, without a validThrough", () => {
    const schema = buildJobPostingSchema({ ...base, applicationDeadline: null }, "https://x.com", now)!;
    expect(schema).not.toHaveProperty("validThrough");
  });
});

describe("serializeJsonLd", () => {
  it("can't be broken out of by a closing script tag in the data", () => {
    const out = serializeJsonLd({ description: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).description).toBe("</script><script>alert(1)</script>");
  });
});
