// Split out from lib/location.ts so client components (LocationPicker) can
// import just the cookie name without pulling in next/headers/prisma —
// bundling either into client code fails the build outright.
export const LOCATION_COOKIE_NAME = "sa_city";

// Shown even before any events/competitions exist in them, so a first-time
// visitor always has reasonable options.
export const CURATED_CITIES = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Kochi",
  "Lucknow",
];
