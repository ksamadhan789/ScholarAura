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

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export async function sendEventReminderEmail(
  to: string,
  name: string,
  eventTitle: string,
  startDate: Date,
  venueOrLink: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send event reminder email");
    return false;
  }

  const displayName = name.trim() || "there";
  const when = formatDateTime(startDate);
  const eventsUrl = `${SITE_URL}/dashboard/registrations`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Reminder: ${eventTitle} starts soon`,
      text: `Hi ${displayName},\n\nThis is a reminder that "${eventTitle}" starts on ${when}.\n\nVenue/link: ${venueOrLink}\n\nView your registration: ${eventsUrl}\n\nSee you there!\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>This is a reminder that <strong>${eventTitle}</strong> starts on <strong>${when}</strong>.</p>
        <p>Venue/link: ${venueOrLink}</p>
        <p>
          <a href="${eventsUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Registration</a>
        </p>
        <p>See you there!<br>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send event reminder email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send event reminder email:", err);
    return false;
  }

  return true;
}

export async function sendCompetitionReminderEmail(
  to: string,
  name: string,
  competitionTitle: string,
  submissionDeadline: Date
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send competition reminder email");
    return false;
  }

  const displayName = name.trim() || "there";
  const when = formatDateTime(submissionDeadline);
  const entriesUrl = `${SITE_URL}/dashboard/entries`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Reminder: submission deadline for ${competitionTitle} is approaching`,
      text: `Hi ${displayName},\n\nThis is a reminder that the submission deadline for "${competitionTitle}" is ${when}.\n\nView your entry: ${entriesUrl}\n\nGood luck!\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>This is a reminder that the submission deadline for <strong>${competitionTitle}</strong> is <strong>${when}</strong>.</p>
        <p>
          <a href="${entriesUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Entry</a>
        </p>
        <p>Good luck!<br>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send competition reminder email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send competition reminder email:", err);
    return false;
  }

  return true;
}

export async function sendWaitlistSeatAvailableEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventUrl: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send waitlist seat available email");
    return false;
  }

  const displayName = name.trim() || "there";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `A seat just opened up for ${eventTitle}`,
      text: `Hi ${displayName},\n\nA seat just opened up for "${eventTitle}", which you're on the waitlist for.\n\nSeats are first-come, first-served, so register soon before it fills up again: ${eventUrl}\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>A seat just opened up for <strong>${eventTitle}</strong>, which you're on the waitlist for.</p>
        <p>Seats are first-come, first-served, so register soon before it fills up again:</p>
        <p>
          <a href="${eventUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Register now</a>
        </p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send waitlist seat available email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send waitlist seat available email:", err);
    return false;
  }

  return true;
}

export async function sendAdminDigestEmail(
  to: string,
  name: string,
  stats: {
    newStudents: number;
    revenue: number;
    newCoursePurchases: number;
    newEventRegistrations: number;
    newCompetitionEntries: number;
    pendingColleges: number;
    failedCertificates: number;
  }
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send admin digest email");
    return false;
  }

  const displayName = name.trim() || "there";
  const adminUrl = `${SITE_URL}/dashboard/admin`;

  const rows: [string, string][] = [
    ["New students", stats.newStudents.toLocaleString("en-IN")],
    ["Revenue collected", `₹${stats.revenue.toLocaleString("en-IN")}`],
    ["New course enrollments", stats.newCoursePurchases.toLocaleString("en-IN")],
    ["New event registrations", stats.newEventRegistrations.toLocaleString("en-IN")],
    ["New competition entries", stats.newCompetitionEntries.toLocaleString("en-IN")],
    ["Colleges pending approval", stats.pendingColleges.toLocaleString("en-IN")],
    ["Certificates needing attention", stats.failedCertificates.toLocaleString("en-IN")],
  ];

  const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#666;">${label}</td><td style="padding:6px 12px;font-weight:600;">${value}</td></tr>`
    )
    .join("");

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: "ScholarAura — daily admin digest",
      text: `Hi ${displayName},\n\nHere's what happened on ScholarAura in the last 24 hours:\n\n${textRows}\n\nFull dashboard: ${adminUrl}\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Here's what happened on ScholarAura in the last 24 hours:</p>
        <table cellspacing="0" cellpadding="0">${htmlRows}</table>
        <p style="margin-top:16px;">
          <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Open admin dashboard</a>
        </p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send admin digest email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send admin digest email:", err);
    return false;
  }

  return true;
}
