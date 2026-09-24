import { CURATED_CITIES } from "@/lib/locationConstants";

// Many Indian cities go by an old and a new name ("Bangalore" vs
// "Bengaluru"). Each group lists every spelling we treat as the same place;
// the first entry is the canonical one saved on new jobs.
const CITY_ALIAS_GROUPS: string[][] = [
  ["Bengaluru", "Bangalore"],
  ["Mumbai", "Bombay"],
  ["Kolkata", "Calcutta"],
  ["Chennai", "Madras"],
  ["Gurugram", "Gurgaon"],
  ["Kochi", "Cochin"],
  ["Pune", "Poona"],
  ["Thiruvananthapuram", "Trivandrum"],
  ["Mysuru", "Mysore"],
  ["Vadodara", "Baroda"],
  ["Puducherry", "Pondicherry"],
  ["Visakhapatnam", "Vizag"],
  ["Prayagraj", "Allahabad"],
  ["Mangaluru", "Mangalore"],
];

/**
 * Every spelling to match for a chosen city — the city itself first, then
 * any known alternate names. Case-insensitive lookup; unknown cities just
 * return themselves.
 */
export function getCityAliases(city: string): string[] {
  const needle = city.trim().toLowerCase();
  const group = CITY_ALIAS_GROUPS.find((names) => names.some((n) => n.toLowerCase() === needle));
  if (!group) return [city.trim()];
  return [city.trim(), ...group.filter((n) => n.toLowerCase() !== needle)];
}

/**
 * Normalizes a city typed into a form before it's saved: trims it, maps any
 * known alternate name to the current one ("Bangalore" → "Bengaluru"), and
 * matches the curated list's spelling regardless of case ("mumbai" →
 * "Mumbai"). Anything else is kept as typed. Empty input → null.
 */
export function canonicalCityName(input: string | null | undefined): string | null {
  const trimmed = input?.trim();
  if (!trimmed) return null;
  const needle = trimmed.toLowerCase();
  const group = CITY_ALIAS_GROUPS.find((names) => names.some((n) => n.toLowerCase() === needle));
  if (group) return group[0];
  const curated = CURATED_CITIES.find((c) => c.toLowerCase() === needle);
  return curated ?? trimmed;
}
