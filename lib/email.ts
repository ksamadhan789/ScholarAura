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
      replyTo: process.env.CERTIFICATE_REPLY_TO_EMAIL ?? "scholaraura@gmail.com",
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

const CONTENT_KIND_LABEL: Record<"course" | "event" | "competition", string> = {
  course: "course",
  event: "event",
  competition: "competition",
};

export async function sendNewContentMatchingInterestEmail(
  to: string,
  name: string,
  kind: "course" | "event" | "competition",
  title: string,
  url: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send new content interest email");
    return false;
  }

  const displayName = name.trim() || "there";
  const label = CONTENT_KIND_LABEL[kind];

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `New ${label} on ScholarAura: ${title}`,
      text: `Hi ${displayName},\n\nA new ${label} just went live on ScholarAura that matches your field of study: "${title}".\n\nCheck it out: ${url}\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>A new ${label} just went live on ScholarAura that matches your field of study: <strong>${title}</strong>.</p>
        <p>
          <a href="${url}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Check it out</a>
        </p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send new content interest email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send new content interest email:", err);
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
    pendingRecruiters: number;
    pendingJobs: number;
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
    ["Recruiter accounts pending review", stats.pendingRecruiters.toLocaleString("en-IN")],
    ["Job postings pending review", stats.pendingJobs.toLocaleString("en-IN")],
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

export async function sendEventRegistrationConfirmationEmail(
  to: string,
  name: string,
  eventTitle: string,
  startDate: Date,
  venueOrLink: string,
  enrollmentNumber: string | null
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send event registration confirmation email");
    return false;
  }

  const displayName = name.trim() || "there";
  const when = formatDateTime(startDate);
  const registrationsUrl = `${SITE_URL}/dashboard/registrations`;
  const enrollmentLine = enrollmentNumber ? `\n\nEnrollment number: ${enrollmentNumber}` : "";
  const enrollmentHtml = enrollmentNumber
    ? `<p>Enrollment number: <strong>${enrollmentNumber}</strong></p>`
    : "";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `You're registered for ${eventTitle}`,
      text: `Hi ${displayName},\n\nYou're confirmed for "${eventTitle}" on ${when}.\n\nVenue/link: ${venueOrLink}${enrollmentLine}\n\nView your registration: ${registrationsUrl}\n\nSee you there!\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>You're confirmed for <strong>${eventTitle}</strong> on <strong>${when}</strong>.</p>
        <p>Venue/link: ${venueOrLink}</p>
        ${enrollmentHtml}
        <p>
          <a href="${registrationsUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Registration</a>
        </p>
        <p>See you there!<br>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send event registration confirmation email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send event registration confirmation email:", err);
    return false;
  }

  return true;
}

export async function sendCompetitionEntryConfirmationEmail(
  to: string,
  name: string,
  competitionTitle: string,
  submissionDeadline: Date,
  enrollmentNumber: string | null
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send competition entry confirmation email");
    return false;
  }

  const displayName = name.trim() || "there";
  const when = formatDateTime(submissionDeadline);
  const entriesUrl = `${SITE_URL}/dashboard/entries`;
  const enrollmentLine = enrollmentNumber ? `\n\nEnrollment number: ${enrollmentNumber}` : "";
  const enrollmentHtml = enrollmentNumber
    ? `<p>Enrollment number: <strong>${enrollmentNumber}</strong></p>`
    : "";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `You're entered in ${competitionTitle}`,
      text: `Hi ${displayName},\n\nYou're confirmed for "${competitionTitle}". Submission deadline: ${when}.${enrollmentLine}\n\nView your entry: ${entriesUrl}\n\nGood luck!\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>You're confirmed for <strong>${competitionTitle}</strong>. Submission deadline: <strong>${when}</strong>.</p>
        ${enrollmentHtml}
        <p>
          <a href="${entriesUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View Entry</a>
        </p>
        <p>Good luck!<br>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send competition entry confirmation email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send competition entry confirmation email:", err);
    return false;
  }

  return true;
}

export async function sendJobApplicationReceivedEmail(
  to: string,
  name: string,
  jobTitle: string,
  companyName: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send job application email");
    return false;
  }

  const displayName = name.trim() || "there";
  const applicationsUrl = `${SITE_URL}/dashboard/job-applications`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Application received: ${jobTitle} at ${companyName}`,
      text: `Hi ${displayName},\n\nWe've received your application for "${jobTitle}" at ${companyName}.\n\nTrack your application: ${applicationsUrl}\n\nGood luck!\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>We've received your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <p>
          <a href="${applicationsUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Track Application</a>
        </p>
        <p>Good luck!<br>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send job application email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send job application email:", err);
    return false;
  }

  return true;
}

export async function sendRecruiterAccountApprovedEmail(to: string, name: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send recruiter approval email");
    return false;
  }

  const displayName = name.trim() || "there";
  const dashboardUrl = `${SITE_URL}/dashboard/recruiter`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: "Your ScholarAura recruiter account is approved",
      text: `Hi ${displayName},\n\nYour recruiter account has been approved. You can now post jobs — each posting is still reviewed before it goes live.\n\nPost a job: ${dashboardUrl}\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Your recruiter account has been approved. You can now post jobs — each posting is still reviewed before it goes live.</p>
        <p>
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Post a job</a>
        </p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send recruiter approval email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send recruiter approval email:", err);
    return false;
  }

  return true;
}

export async function sendRecruiterAccountRejectedEmail(
  to: string,
  name: string,
  reason: string | null
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send recruiter rejection email");
    return false;
  }

  const displayName = name.trim() || "there";
  const reasonLine = reason ? `\n\nReason: ${reason}` : "";
  const reasonHtml = reason ? `<p>Reason: ${reason}</p>` : "";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: "Your ScholarAura recruiter account application",
      text: `Hi ${displayName},\n\nWe weren't able to approve your recruiter account at this time.${reasonLine}\n\nIf you think this is a mistake, reply to this email.\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>We weren't able to approve your recruiter account at this time.</p>
        ${reasonHtml}
        <p>If you think this is a mistake, reply to this email.</p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send recruiter rejection email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send recruiter rejection email:", err);
    return false;
  }

  return true;
}

export async function sendJobApprovedEmail(to: string, name: string, jobTitle: string): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send job approval email");
    return false;
  }

  const displayName = name.trim() || "there";
  const dashboardUrl = `${SITE_URL}/dashboard/recruiter`;

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Your job posting "${jobTitle}" is live`,
      text: `Hi ${displayName},\n\nYour job posting "${jobTitle}" has been approved and is now live on ScholarAura.\n\nView it: ${dashboardUrl}\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Your job posting <strong>${jobTitle}</strong> has been approved and is now live on ScholarAura.</p>
        <p>
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">View your jobs</a>
        </p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send job approval email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send job approval email:", err);
    return false;
  }

  return true;
}

export async function sendJobRejectedEmail(
  to: string,
  name: string,
  jobTitle: string,
  reason: string | null
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send job rejection email");
    return false;
  }

  const displayName = name.trim() || "there";
  const dashboardUrl = `${SITE_URL}/dashboard/recruiter`;
  const reasonLine = reason ? `\n\nReason: ${reason}` : "";
  const reasonHtml = reason ? `<p>Reason: ${reason}</p>` : "";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Your job posting "${jobTitle}" needs changes`,
      text: `Hi ${displayName},\n\nYour job posting "${jobTitle}" wasn't approved as submitted.${reasonLine}\n\nYou can edit and resubmit it here: ${dashboardUrl}\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Your job posting <strong>${jobTitle}</strong> wasn't approved as submitted.</p>
        ${reasonHtml}
        <p>
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background-color:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Edit and resubmit</a>
        </p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send job rejection email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send job rejection email:", err);
    return false;
  }

  return true;
}

export async function sendRefundRequestApprovedEmail(
  to: string,
  name: string,
  itemTitle: string
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send refund request approved email");
    return false;
  }

  const displayName = name.trim() || "there";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Your refund for ${itemTitle} has been approved`,
      text: `Hi ${displayName},\n\nYour refund request for "${itemTitle}" has been approved and processed. It should reflect on your original payment method within a few business days.\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Your refund request for <strong>${itemTitle}</strong> has been approved and processed. It should reflect on your original payment method within a few business days.</p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send refund request approved email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send refund request approved email:", err);
    return false;
  }

  return true;
}

export async function sendRefundRequestRejectedEmail(
  to: string,
  name: string,
  itemTitle: string,
  reason: string | null
): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY is not set — cannot send refund request rejected email");
    return false;
  }

  const displayName = name.trim() || "there";
  const reasonLine = reason ? `\n\nReason: ${reason}` : "";
  const reasonHtml = reason ? `<p>Reason: ${reason}</p>` : "";

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "ScholarAura <onboarding@resend.dev>",
      to,
      subject: `Your refund request for ${itemTitle} was not approved`,
      text: `Hi ${displayName},\n\nYour refund request for "${itemTitle}" was reviewed and not approved.${reasonLine}\n\nIf you have questions, just reply to this email.\n\nTeam ScholarAura`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Your refund request for <strong>${itemTitle}</strong> was reviewed and not approved.</p>
        ${reasonHtml}
        <p>If you have questions, just reply to this email.</p>
        <p>Team ScholarAura</p>
      `,
    });

    if (error) {
      console.error("Failed to send refund request rejected email:", error);
      return false;
    }
  } catch (err) {
    console.error("Failed to send refund request rejected email:", err);
    return false;
  }

  return true;
}
