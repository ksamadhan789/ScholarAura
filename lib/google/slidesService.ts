import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google/serviceAccount";
import { getDelegatedGoogleAuth } from "@/lib/google/delegatedAuth";

const SLIDES_SCOPE = "https://www.googleapis.com/auth/presentations";

/**
 * Replaces every occurrence of each placeholder key (e.g. "{{NAME}}") with
 * its value across all slides of the given presentation, in a single batch.
 * Once a presentation was created via the delegated account (see
 * driveService.copyFile), only that same account has edit access to it, so
 * this prefers delegated auth the same way driveService does.
 */
export async function replacePlaceholders(
  presentationId: string,
  replacements: Record<string, string>
): Promise<void> {
  const delegated = await getDelegatedGoogleAuth();
  const auth = delegated ?? getGoogleAuth([SLIDES_SCOPE]);
  if (!auth) {
    throw new Error(
      "Google Slides is not configured — connect a Google account from the certificates page, or set GOOGLE_SERVICE_ACCOUNT_KEY"
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
