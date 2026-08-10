import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = process.env.EMAIL_SERVER_PORT;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.error("EMAIL_SERVER_* env vars are not set — cannot send password reset email");
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@scholaraura.com",
      to,
      subject: "Reset your ScholarAura password",
      text: `Someone requested a password reset for your ScholarAura account.\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
      html: `
        <p>Someone requested a password reset for your ScholarAura account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    return false;
  }

  return true;
}
