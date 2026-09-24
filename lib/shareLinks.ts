// Share-link builders for the ShareButtons component and the "Add to
// LinkedIn" certificate button. Pure functions (no browser APIs) so they can
// be unit-tested and used from server or client components alike. Every
// target is a plain public share URL — no SDKs, API keys or tracking pixels.

export type ShareTarget = "whatsapp" | "linkedin" | "x" | "facebook" | "email";

export function buildShareLinks({
  url,
  title,
}: {
  url: string;
  title: string;
}): Record<ShareTarget, string> {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    // WhatsApp has no separate URL field — the link goes in the message text.
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    email: `mailto:?subject=${t}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
  };
}

/**
 * LinkedIn's "Add licence or certification" form, pre-filled — the holder
 * clicks it, reviews the fields on LinkedIn and saves it to their profile.
 * `certUrl` should be the public /verify page so anyone viewing their
 * LinkedIn can check the certificate is genuine.
 */
export function buildLinkedInAddCertificateUrl({
  name,
  issuedAt,
  certUrl,
  certId,
}: {
  name: string;
  issuedAt: Date;
  certUrl: string;
  certId: string;
}): string {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name,
    organizationName: "ScholarAura",
    issueYear: String(issuedAt.getFullYear()),
    issueMonth: String(issuedAt.getMonth() + 1),
    certUrl,
    certId,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
