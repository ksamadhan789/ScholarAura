import type { Prisma } from "@prisma/client";
import { getCityAliases } from "@/lib/cityAliases";

/**
 * Prisma filter for "jobs in this city". Jobs with a structured `city` are
 * matched on it exactly (case-insensitive, any alternate name). Older jobs
 * posted before `city` existed, or where the poster left it blank, fall back
 * to the previous loose text match against the free-text `location`.
 */
export function jobCityWhere(city: string): Prisma.JobWhereInput {
  const names = getCityAliases(city);
  return {
    OR: [
      ...names.map((name) => ({ city: { equals: name, mode: "insensitive" as const } })),
      {
        city: null,
        OR: names.map((name) => ({ location: { contains: name, mode: "insensitive" as const } })),
      },
    ],
  };
}

/**
 * What to show as a job's place: its free-text location, plus the structured
 * city when the location doesn't already mention it under any of its names
 * ("Whitefield" + "Bengaluru" → "Whitefield, Bengaluru", but "Bangalore,
 * India" + "Bengaluru" stays as is).
 */
export function formatJobLocation(job: { location: string; city: string | null }): string {
  if (!job.city) return job.location;
  const location = job.location.toLowerCase();
  const alreadyNamed = getCityAliases(job.city).some((name) => location.includes(name.toLowerCase()));
  return alreadyNamed ? job.location : `${job.location}, ${job.city}`;
}
