// Fields of an Event/Competition row that must never leave the server for a
// non-admin: the paid event's joining link (shown only to registrants on the
// event page), the Apps Script webhook secret, and the Google Form/Sheet/
// Slides wiring used for attendance and certificates.
const PRIVATE_LISTING_FIELDS = [
  "venueOrLink",
  "webhookSecret",
  "googleFormUrl",
  "googleFormNameEntryId",
  "googleFormEmailEntryId",
  "googleFormEnrollmentEntryId",
  "googleSheetId",
  "googleSlidesTemplateId",
] as const;

type PrivateField = (typeof PRIVATE_LISTING_FIELDS)[number];

/** A copy of an event/competition row that is safe to return from a public API. */
export function toPublicListing<T extends object>(row: T): Omit<T, PrivateField> {
  const copy = { ...row } as Record<string, unknown>;
  for (const field of PRIVATE_LISTING_FIELDS) delete copy[field];
  return copy as Omit<T, PrivateField>;
}
