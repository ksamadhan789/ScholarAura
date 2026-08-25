import { Resend } from "resend";
import { SITE_URL } from "@/lib/siteUrl";

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

  const displayName = name.trim() || "there";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: "Reset your ScholarAura password",
      text: `Hi ${displayName},\n\nWe received a request to reset your ScholarAura account password.\n\nIf this was you, use the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes for your security.\n\nIf you didn't request this, please ignore this email; your password will remain unchanged.\n\nStay safe,\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>We received a request to reset your ScholarAura account password.</p>
        <p>If this was you, click the button below to set a new password:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Reset Password</a>
        </p>
        <p>This link will expire in 30 minutes for your security.</p>
        <p>If you didn't request this, please ignore this email; your password will remain unchanged.</p>
        <p>Stay safe,<br>Team ScholarAura</p>
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

export async function sendCertificateReadyEmail(
  to: string,
  name: string,
  certificateNumber: string,
  eventTitle: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send certificate ready email");
    return false;
  }

  const displayName = name.trim() || "there";
  const certificatesUrl = `${SITE_URL}/dashboard/certificates`;
  const verifyUrl = `${SITE_URL}/verify/${certificateNumber}`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Your certificate for ${eventTitle} is ready`,
      text: `Hi ${displayName},\n\nYour certificate for "${eventTitle}" is ready.\n\nCertificate number: ${certificateNumber}\n\nView and download it here: ${certificatesUrl}\n\nYou can verify it anytime at: ${verifyUrl}\n\nCongratulations!\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Your certificate for <strong>${eventTitle}</strong> is ready.</p>
        <p>
          <a href="${certificatesUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Certificate</a>
        </p>
        <p>Certificate number: <strong>${certificateNumber}</strong></p>
        <p>You can verify it anytime at <a href="${verifyUrl}">${verifyUrl}</a>.</p>
        <p>Congratulations!<br>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send certificate ready email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send certificate ready email:", err);
    return false;
  }

  return true;
}
