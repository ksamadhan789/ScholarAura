import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn().mockResolvedValue({ data: { id: "email_1" }, error: null });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function MockResend(this: { emails: { send: typeof sendMock } }) {
    this.emails = { send: sendMock };
  }),
}));

import {
  sendJobApplicationReceivedEmail,
  sendEventRegistrationConfirmationEmail,
  sendRecruiterAccountRejectedEmail,
} from "@/lib/email";

const XSS_PAYLOAD = `<img src=x onerror="alert('xss')">`;

beforeEach(() => {
  sendMock.mockClear();
  process.env.RESEND_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
});

describe("email HTML escaping", () => {
  it("escapes a recruiter-controlled job title and company name in the HTML body, but not the text body", async () => {
    await sendJobApplicationReceivedEmail("student@example.com", "Student", XSS_PAYLOAD, XSS_PAYLOAD);

    const call = sendMock.mock.calls[0][0];
    expect(call.html).not.toContain(XSS_PAYLOAD);
    expect(call.html).toContain("&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;");
    // The plain-text body is never rendered as markup, so it keeps the raw value.
    expect(call.text).toContain(XSS_PAYLOAD);
  });

  it("escapes a student's own name and an admin/instructor-controlled venue field", async () => {
    await sendEventRegistrationConfirmationEmail(
      "student@example.com",
      XSS_PAYLOAD,
      XSS_PAYLOAD,
      new Date(),
      XSS_PAYLOAD,
      null
    );

    const call = sendMock.mock.calls[0][0];
    expect(call.html).not.toContain(XSS_PAYLOAD);
    expect(call.text).toContain(XSS_PAYLOAD);
  });

  it("escapes an admin-supplied rejection reason", async () => {
    await sendRecruiterAccountRejectedEmail("recruiter@example.com", "Recruiter", XSS_PAYLOAD);

    const call = sendMock.mock.calls[0][0];
    expect(call.html).not.toContain(XSS_PAYLOAD);
    expect(call.text).toContain(XSS_PAYLOAD);
  });
});
