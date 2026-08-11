import { Resend } from "resend";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send password reset email");
    return false;
  }

  const firstName = name.trim().split(" ")[0] || "there";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: "🔑 Reset your ScholarAura password",
      text: `Hi ${firstName},\n\nSomeone requested a password reset for your ScholarAura account. If that was you, use the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, no action is needed — your password stays the same.\n\n— The ScholarAura team`,
      html: `
        <p>Hi ${firstName},</p>
        <p>Someone requested a password reset for your ScholarAura account. If that was you, click below to set a new password:</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, no action is needed — your password stays the same.</p>
        <p>— The ScholarAura team</p>
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
