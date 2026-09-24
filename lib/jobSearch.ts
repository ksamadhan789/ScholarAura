import type { EmploymentType, Prisma } from "@prisma/client";
import { jobCityWhere } from "@/lib/jobCity";

export type JobSearchFilters = {
  query?: string | null;
  employmentType?: string | null;
  remoteOnly?: boolean;
  city?: string | null;
};

const EMPLOYMENT_TYPES = new Set(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"]);

/** The employment type if it's a real one, else null (ignores junk from URLs/forms). */
export function parseEmploymentType(value: string | null | undefined): EmploymentType | null {
  return value && EMPLOYMENT_TYPES.has(value) ? (value as EmploymentType) : null;
}

/**
 * The search/filter part of a /jobs query — shared by the /jobs page and job
 * alerts (lib/jobAlerts.ts), so an alert matches exactly what its owner saw
 * when they saved it. Visibility rules (published, approved, deadline) are
 * the caller's to add.
 */
export function jobSearchWhere(filters: JobSearchFilters): Prisma.JobWhereInput {
  const q = filters.query?.trim();
  const type = parseEmploymentType(filters.employmentType);
  return {
    ...(type ? { employmentType: type } : {}),
    ...(filters.remoteOnly ? { isRemote: true } : {}),
    AND: [
      ...(filters.city ? [jobCityWhere(filters.city)] : []),
      ...(q
        ? [
            {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { companyName: { contains: q, mode: "insensitive" as const } },
                { location: { contains: q, mode: "insensitive" as const } },
                { city: { contains: q, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };
}
