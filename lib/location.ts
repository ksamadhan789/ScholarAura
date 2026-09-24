import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { LOCATION_COOKIE_NAME, CURATED_CITIES } from "@/lib/locationConstants";

export { LOCATION_COOKIE_NAME, CURATED_CITIES };

/** Reads the visitor's site-wide location preference — undefined if never set. */
export function readLocationCookie(): string | undefined {
  return cookies().get(LOCATION_COOKIE_NAME)?.value || undefined;
}

/**
 * Every city worth offering in a picker: the curated list plus any city an
 * Event, Competition or Job actually uses, deduped and sorted. Used by the
 * header LocationPicker and the Jobs filter.
 */
export async function getKnownCities(): Promise<string[]> {
  const [eventCities, competitionCities, jobCities] = await Promise.all([
    prisma.event.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
    }),
    prisma.competition.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ["city"],
    }),
    prisma.job.findMany({
      where: { city: { not: null }, isPublished: true },
      select: { city: true },
      distinct: ["city"],
    }),
  ]);

  const cities = new Set<string>(CURATED_CITIES);
  for (const e of eventCities) if (e.city) cities.add(e.city);
  for (const c of competitionCities) if (c.city) cities.add(c.city);
  for (const j of jobCities) if (j.city) cities.add(j.city);

  return Array.from(cities).sort((a, b) => a.localeCompare(b));
}
