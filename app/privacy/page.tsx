export const metadata = {
  title: "Privacy Policy",
  description: "How ScholarAura collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">Last updated: August 13, 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          This Privacy Policy explains what information ScholarAura ("we", "us") collects, how we use it, and the
          choices you have. By using scholaraura.com (the "Platform"), you agree to this Policy.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Account information:</strong> name, email address, and (optionally) phone number, organization, field of study, or job role, provided when you register, sign in with Google, or complete your profile.</li>
            <li><strong>Course, event &amp; competition activity:</strong> which courses you enroll in, lecture progress, which events you register for, and which competitions you enter, including submission files or links you upload.</li>
            <li><strong>Payment records:</strong> purchase amount, currency, and payment status for courses/events/competitions. Card and bank details are entered directly into Razorpay and are never stored on our servers.</li>
            <li><strong>Referral data:</strong> your referral code, who you referred, and referral credit earned/redeemed.</li>
            <li><strong>Certificates:</strong> your name and course/event/competition details as they appear on any certificate issued to you, plus a public certificate number used for verification.</li>
            <li><strong>Consent &amp; preferences:</strong> when you accepted our Privacy Policy and Terms of Use, and whether you've opted in to marketing communications.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">2. How We Use Information</h2>
          <p>
            We use your information to operate the Platform: creating and securing your account, granting access to
            purchased courses/registered events/competitions, processing payments, issuing and verifying
            certificates, tracking referral credit, and communicating with you about your account, purchases, or
            platform updates.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">3. Cookies &amp; Tracking</h2>
          <p>
            We use strictly necessary cookies to keep you signed in and to remember your session. We do not use
            third-party advertising cookies. If you use the optional Google Website Translate feature, Google may
            set its own cookies to remember your language preference — see Google's own privacy policy for details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">4. Third-Party Services</h2>
          <p>We rely on a small number of third-party services to operate the Platform:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Razorpay</strong> — payment processing.</li>
            <li><strong>Google</strong> — optional sign-in (Google OAuth).</li>
            <li><strong>Bunny.net</strong> — secure video hosting/streaming for course lectures.</li>
            <li><strong>Vercel &amp; Neon</strong> — application hosting and database infrastructure.</li>
            <li><strong>Resend</strong> — transactional email delivery (e.g. password resets, account notifications).</li>
            <li><strong>Google Website Translate</strong> — optional, client-side page translation if you choose to use it.</li>
          </ul>
          <p className="mt-2">
            Each of these providers processes data under their own privacy policies; we only share what's necessary
            for them to perform their function (e.g. Razorpay receives purchase amount and your email for receipts).
            Our hosting and database infrastructure (Vercel, Neon) may process and store data on servers located
            outside India; we take reasonable steps to ensure these providers offer an adequate level of data
            protection.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">5. Information Sharing &amp; Disclosure</h2>
          <p>
            We do not sell your personal information. We share it only: with the third-party service providers
            listed above, as needed for them to perform their function; with event/competition organizers or
            instructors where necessary to run that specific event, course, or competition (e.g. your name for a
            seat list or entry roster); when required by law, court order, or governmental request; or with your
            consent.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">6. Data Retention</h2>
          <p>
            We retain account, purchase, and certificate records for as long as your account is active, and as
            needed to comply with legal, tax, or accounting obligations. Certificate verification records are kept
            indefinitely so certificates remain verifiable.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">7. Your Rights &amp; Choices</h2>
          <p>
            You can review and update your account details from your dashboard. Subject to applicable law
            (including India's Digital Personal Data Protection Act, 2023), you have the right to access the
            personal data we hold about you, request correction of inaccurate data, and request erasure of your
            data. To exercise any of these rights, email us at{" "}
            <a href="mailto:scholaraura@gmail.com" className="text-brand-600 underline dark:text-brand-400">
              scholaraura@gmail.com
            </a>
            . Note that we may need to retain certain purchase/certificate records even after account deletion for
            legal or verification purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">8. Marketing Communications</h2>
          <p>
            During onboarding, you can choose whether to receive updates about new courses, events, and
            competitions. If you opt in, you can withdraw consent at any time by emailing{" "}
            <a href="mailto:scholaraura@gmail.com" className="text-brand-600 underline dark:text-brand-400">
              scholaraura@gmail.com
            </a>{" "}
            or using the unsubscribe link included in any marketing email. Transactional emails related to your
            account, purchases, or password resets are sent regardless of this preference, as they're necessary to
            operate the Platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">9. Children's Privacy</h2>
          <p>
            The Platform is not directed at children under 18. We do not knowingly collect personal information
            from anyone under 18 without the involvement and consent of a parent or legal guardian. If you believe
            a child has provided us with personal information without appropriate consent, contact us and we will
            take steps to remove it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">10. Security</h2>
          <p>
            Passwords are stored using one-way hashing, not in plain text. Access to paid course lectures and
            private event/competition details is restricted to users with a confirmed purchase or registration. No
            online system is 100% secure, but we take reasonable steps to protect your data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time; continued use of the Platform means you accept the current version.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">12. Contact</h2>
          <p>
            Questions about this Policy can be sent to{" "}
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
