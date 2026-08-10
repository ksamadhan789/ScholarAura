import { Resend } from "resend";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send password reset email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: "Reset your ScholarAura password",
      text: `Someone requested a password reset for your ScholarAura account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
      html: `
        <p>Someone requested a password reset for your ScholarAura account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    return false;
  }

  return true;
}
