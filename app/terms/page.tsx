export const metadata = {
  title: "Terms of Service",
  description: "The terms and conditions that govern your use of ScholarAura.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Terms of Service</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">Last updated: August 13, 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          These Terms of Service ("Terms") govern your use of ScholarAura (the "Platform"), accessible at
          scholaraura.com, which offers prerecorded courses, international and national conferences, faculty
          development programs (FDPs), hands-on trainings, and competitions, along with related features such as
          certificates, registration, and payments. By creating an account or using the Platform, you agree to
          these Terms.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">1. Eligibility</h2>
          <p>
            You must be at least 18 years old to create an account. If you are under 18, you may use the Platform
            only with the involvement and consent of a parent or legal guardian, who agrees to these Terms on your
            behalf and is responsible for your use of the Platform, including any purchases made.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">2. Accounts</h2>
          <p>
            You may create an account using an email/password or Google sign-in. You are responsible for keeping
            your login credentials secure and for all activity under your account. You must provide accurate
            information (name, email, and optionally phone/organization) when registering, and keep it up to date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
            3. Courses, Events &amp; Competitions
          </h2>
          <p>
            Purchasing a course grants you access to its lecture content for personal, non-commercial learning use.
            Registering for an event (conference, FDP, or training) or a competition reserves you a seat or entry,
            subject to availability and eligibility criteria, and gives you access to related details (venue/Zoom
            links, submission instructions) once registration is confirmed. Competition entries, judging criteria,
            and results are governed by the specific rules published on that competition's page in addition to
            these Terms. We may update, reschedule, or occasionally cancel courses, events, or competitions; where
            reasonably possible we will notify registered users in advance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">4. Payments</h2>
          <p>
            Payments are processed through Razorpay. Prices are set in Indian Rupees (INR) and may be displayed in
            other currencies for convenience using manually maintained exchange rates; the INR amount is the
            canonical price. We do not store your card or bank details — these are handled directly by Razorpay.
            See our <a href="/refund-policy" className="text-brand-600 underline dark:text-brand-400">Refund Policy</a> for
            cancellation and refund terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">5. Referral Credits</h2>
          <p>
            Users may earn platform credit by referring others who complete a paid purchase, as described on the
            referrals page. Credit has no cash value outside the Platform, can only be applied toward future
            purchases, and may be adjusted or revoked if we determine it was earned through fraudulent or abusive
            activity.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">6. Certificates</h2>
          <p>
            Certificates are issued automatically upon eligible course completion, event attendance, or competition
            participation, and can be verified publicly using the certificate number. Certificates are provided for
            your personal record and professional use; misrepresenting or altering a certificate is prohibited.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Share your account or paid course access with others, or attempt to circumvent access controls;</li>
            <li>Upload, submit, or share unlawful, infringing, defamatory, or fraudulent content, including in
              competition submissions;</li>
            <li>Impersonate another person or misrepresent your affiliation with any person or organization;</li>
            <li>Use automated tools to scrape, copy, or extract content from the Platform without our permission;</li>
            <li>Interfere with or disrupt the Platform, its servers, or other users' use of it.</li>
          </ul>
          <p className="mt-2">
            We may suspend or restrict access for accounts that violate this section.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">8. Intellectual Property</h2>
          <p>
            Course videos, event materials, competition briefs, and other content made available on the Platform
            remain the property of ScholarAura or the respective instructor/organizer and are licensed to you for
            personal, non-commercial use only. You retain ownership of any original work you submit as part of a
            competition entry, but grant us a non-exclusive, royalty-free licence to display, reproduce, and
            promote that submission (e.g. showcasing winning entries) in connection with the competition and the
            Platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">9. Termination</h2>
          <p>
            You may stop using the Platform and request account deletion at any time. We may suspend or terminate
            your account if you violate these Terms, engage in fraudulent activity, or misuse the Platform. Where
            reasonably possible, we will provide notice before termination. Access to already-purchased courses,
            issued certificates, and certificate verification records may be affected by termination, except where
            we are required to preserve them for verification purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">10. Disclaimer &amp; Liability</h2>
          <p>
            The Platform and its content are provided "as is." We do our best to ensure course, event, and
            competition information is accurate, but we do not guarantee uninterrupted access or specific outcomes
            from completing a course, event, training, or competition. To the extent permitted by law, our
            liability is limited to the amount you paid for the specific course, event, or competition giving rise
            to a claim.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">11. Indemnification</h2>
          <p>
            You agree to indemnify and hold ScholarAura harmless from any claims, damages, or expenses arising from
            your violation of these Terms, your misuse of the Platform, or content you submit (including
            competition entries) that infringes the rights of a third party.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">12. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms
            or your use of the Platform will be subject to the exclusive jurisdiction of the courts located in
            India.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">13. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited
            or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force
            and effect.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Platform after changes take effect
            means you accept the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">15. Contact</h2>
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
