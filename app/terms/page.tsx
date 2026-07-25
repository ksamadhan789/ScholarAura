export const metadata = {
  title: "Terms of Service | ScholarAura",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Terms of Service</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">Last updated: July 25, 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          These Terms of Service ("Terms") govern your use of ScholarAura (the "Platform"), accessible at
          scholaraura.com, which offers prerecorded courses, international and national conferences, faculty
          development programs (FDPs), and hands-on trainings, along with related features such as certificates,
          registration, and payments. By creating an account or using the Platform, you agree to these Terms.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">1. Accounts</h2>
          <p>
            You may create an account using an email/password or Google sign-in. You are responsible for keeping
            your login credentials secure and for all activity under your account. You must provide accurate
            information (name, email, and optionally phone/organization) when registering.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">2. Courses, Events &amp; Access</h2>
          <p>
            Purchasing a course grants you access to its lecture content for personal, non-commercial learning use.
            Registering for an event (conference, FDP, or training) reserves you a seat, subject to availability, and
            gives you access to event details (including venue/Zoom links) once registration is confirmed. We may
            update, reschedule, or occasionally cancel courses or events; where reasonably possible we will notify
            registered users in advance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">3. Payments</h2>
          <p>
            Payments are processed through Razorpay. Prices are set in Indian Rupees (INR) and may be displayed in
            other currencies for convenience using manually maintained exchange rates; the INR amount is the
            canonical price. We do not store your card or bank details — these are handled directly by Razorpay.
            See our <a href="/refund-policy" className="text-brand-600 underline dark:text-brand-400">Refund Policy</a> for
            cancellation and refund terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">4. Referral Credits</h2>
          <p>
            Users may earn platform credit by referring others who complete a paid purchase, as described on the
            referrals page. Credit has no cash value outside the Platform, can only be applied toward future
            purchases, and may be adjusted or revoked if we determine it was earned through fraudulent or abusive
            activity.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">5. Certificates</h2>
          <p>
            Certificates are issued automatically upon eligible course completion or event attendance and can be
            verified publicly using the certificate number. Certificates are provided for your personal record and
            professional use; misrepresenting or altering a certificate is prohibited.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">6. Acceptable Use</h2>
          <p>
            You agree not to share your account or paid course access with others, attempt to circumvent access
            controls, upload unlawful or infringing content, or misuse the Platform in a way that disrupts other
            users or our systems.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">7. Disclaimer &amp; Liability</h2>
          <p>
            The Platform and its content are provided "as is." We do our best to ensure course and event information
            is accurate, but we do not guarantee uninterrupted access or specific outcomes from completing a course,
            event, or training. To the extent permitted by law, our liability is limited to the amount you paid for
            the specific course or event giving rise to a claim.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">8. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Platform after changes take effect
            means you accept the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">9. Contact</h2>
          <p>
            Questions about these Terms can be sent to{" "}
            <a href="mailto:scholaraura@gmail.com" className="text-brand-600 underline dark:text-brand-400">
              scholaraura@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
