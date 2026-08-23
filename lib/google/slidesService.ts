import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google/serviceAccount";

const SLIDES_SCOPE = "https://www.googleapis.com/auth/presentations";

/**
 * Replaces every occurrence of each placeholder key (e.g. "{{NAME}}") with
 * its value across all slides of the given presentation, in a single batch.
 */
export async function replacePlaceholders(
  presentationId: string,
  replacements: Record<string, string>
): Promise<void> {
  const auth = getGoogleAuth([SLIDES_SCOPE]);
  if (!auth) {
    throw new Error(
      "Google service account is not configured — set GOOGLE_SERVICE_ACCOUNT_KEY"
    );
  }

  const requests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: { text: placeholder, matchCase: true },
      replaceText: value,
    },
  }));
  if (requests.length === 0) return;

  const slides = google.slides({ version: "v1", auth });
  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });
}
