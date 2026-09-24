// schema.org JobPosting structured data for a job's detail page — what
// Google reads to show the job in Google for Jobs (the job-search panel in
// search results). Built only from fields we already store; salary is left
// out because salaryRange/stipendRange are free text ("₹4–6 LPA") and
// guessing numbers from them risks showing wrong pay (it's optional for
// Google). The site is India-only, so locations are addressCountry "IN".

type JobForSchema = {
  slug: string;
  title: string;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  city: string | null;
  isRemote: boolean;
  employmentType: string;
  description: string;
  requirements: string | null;
  minExperienceYears: number | null;
  applicationDeadline: Date | null;
  isPublished: boolean;
  approvalStatus: string;
  createdAt: Date;
};

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  INTERNSHIP: "INTERN",
  CONTRACT: "CONTRACTOR",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Google's `description` accepts basic HTML — plain text with line breaks kept. */
function toHtmlParagraphs(text: string): string {
  return escapeHtml(text.trim()).replace(/\r?\n/g, "<br>");
}

/**
 * The JobPosting object for a job, or null when the job shouldn't be offered
 * to Google: not published, not approved, or past its application deadline
 * (Google requires expired jobs to stop being marked up).
 */
export function buildJobPostingSchema(
  job: JobForSchema,
  siteUrl: string,
  now: Date = new Date()
): Record<string, unknown> | null {
  if (!job.isPublished || job.approvalStatus !== "APPROVED") return null;
  if (job.applicationDeadline && job.applicationDeadline < now) return null;

  const description = job.requirements
    ? `${toHtmlParagraphs(job.description)}<br><br><strong>Requirements</strong><br>${toHtmlParagraphs(job.requirements)}`
    : toHtmlParagraphs(job.description);

  const logo = job.companyLogoUrl && /^https?:\/\//.test(job.companyLogoUrl) ? job.companyLogoUrl : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: job.createdAt.toISOString(),
    ...(job.applicationDeadline && { validThrough: job.applicationDeadline.toISOString() }),
    employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
      ...(logo && { logo }),
    },
    ...(job.isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "India" },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.city ?? job.location,
              addressCountry: "IN",
            },
          },
        }),
    ...(job.minExperienceYears != null &&
      job.minExperienceYears > 0 && {
        experienceRequirements: {
          "@type": "OccupationalExperienceRequirements",
          monthsOfExperience: job.minExperienceYears * 12,
        },
      }),
    identifier: { "@type": "PropertyValue", name: "ScholarAura", value: job.slug },
    url: `${siteUrl}/jobs/${job.slug}`,
  };
}

/**
 * JSON for a <script type="application/ld+json"> tag. `<` is escaped so text
 * a recruiter typed (e.g. "</script>") can never close the tag early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
