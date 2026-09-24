import { describe, expect, it } from "vitest";
import { buildLinkedInAddCertificateUrl, buildShareLinks } from "@/lib/shareLinks";

describe("buildShareLinks", () => {
  const links = buildShareLinks({ url: "https://scholaraura.com/events/a b", title: "AI & You" });

  it("encodes the URL and title for every target", () => {
    expect(links.linkedin).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fscholaraura.com%2Fevents%2Fa%20b"
    );
    expect(links.x).toContain("text=AI%20%26%20You");
    expect(links.facebook).toContain("u=https%3A%2F%2Fscholaraura.com");
  });

  it("puts the link inside the WhatsApp message and the email body", () => {
    expect(decodeURIComponent(links.whatsapp.split("text=")[1])).toBe(
      "AI & You https://scholaraura.com/events/a b"
    );
    expect(links.email.startsWith("mailto:?subject=AI%20%26%20You&body=")).toBe(true);
  });
});

describe("buildLinkedInAddCertificateUrl", () => {
  it("pre-fills LinkedIn's add-certification form", () => {
    const url = new URL(
      buildLinkedInAddCertificateUrl({
        name: "Python for Data Analysis",
        issuedAt: new Date("2026-03-15T10:00:00Z"),
        certUrl: "https://scholaraura.com/verify/CERT-1",
        certId: "CERT-1",
      })
    );
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      startTask: "CERTIFICATION_NAME",
      name: "Python for Data Analysis",
      organizationName: "ScholarAura",
      issueYear: "2026",
      issueMonth: "3",
      certUrl: "https://scholaraura.com/verify/CERT-1",
      certId: "CERT-1",
    });
  });
});
