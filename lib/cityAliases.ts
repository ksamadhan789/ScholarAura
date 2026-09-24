// Job.location is free text, so a recruiter may write the old or the new
// name of the same city ("Bangalore" vs "Bengaluru"). Each group lists every
// spelling we treat as the same place when filtering by city.
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
