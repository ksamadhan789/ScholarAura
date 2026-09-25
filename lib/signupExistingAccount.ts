import bcrypt from "bcryptjs";
import { checkRateLimit, VERIFY_EMAIL_SEND_LIMIT, VERIFY_EMAIL_SEND_WINDOW_MS } from "@/lib/rateLimit";
import { sendAccountAlreadyExistsEmail } from "@/lib/email";

/**
 * The sign-up response body for a *new* account. The routes send exactly the
 * same body when the email is already taken, so the form can't be used to
 * check who has a ScholarAura account.
 */
export function signupResponseBody(email: string, needsVerification: boolean) {
  return { email, needsVerification };
}

/**
 * Sign-up with an email that already has an account: do the same slow work a
 * real sign-up does (hash the password, so response timing doesn't give it
 * away), email the real owner how to sign in instead (rate-limited per
 * address so the form can't be used to spam someone's inbox), and return
 * the body a successful sign-up returns. Deactivated accounts get no email.
 *
 * `needsVerification` is always true here: the page then shows "check your
 * inbox" — which is accurate, since that's where the owner's email went —
 * instead of trying to sign in with a password that may not be theirs.
 */
export async function handleSignupForExistingAccount(
  existing: { email: string; name: string; passwordHash: string | null; deactivatedAt: Date | null },
  password: string,
  submittedEmail: string,
) {
  await bcrypt.hash(password, 10);

  if (!existing.deactivatedAt) {
    const allowed = await checkRateLimit(
      `account-exists-email:${existing.email.toLowerCase()}`,
      VERIFY_EMAIL_SEND_LIMIT,
      VERIFY_EMAIL_SEND_WINDOW_MS,
    );
    if (allowed) {
      await sendAccountAlreadyExistsEmail(existing.email, existing.name, {
        hasPassword: !!existing.passwordHash,
      }).catch((err) => console.error("Failed to send account-already-exists email:", err));
    }
  }

  return signupResponseBody(submittedEmail, true);
}
