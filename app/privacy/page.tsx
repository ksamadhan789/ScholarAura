export const metadata = {
  title: "Privacy Policy | ScholarAura",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">Last updated: July 25, 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          This Privacy Policy explains what information ScholarAura ("we", "us") collects, how we use it, and the
          choices you have. By using scholaraura.com (the "Platform"), you agree to this Policy.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Account information:</strong> name, email address, and (optionally) phone number and organization, provided when you register or sign in with Google.</li>
            <li><strong>Course &amp; event activity:</strong> which courses you enroll in, lecture progress, and which events you register for.</li>
            <li><strong>Payment records:</strong> purchase amount, currency, and payment status for courses/events. Card and bank details are entered directly into Razorpay and are never stored on our servers.</li>
            <li><strong>Referral data:</strong> your referral code, who you referred, and referral credit earned/redeemed.</li>
            <li><strong>Certificates:</strong> your name and course/event details as they appear on any certificate issued to you, plus a public certificate number used for verification.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">2. How We Use Information</h2>
          <p>
            We use your information to operate the Platform: creating and securing your account, granting access to
            purchased courses/registered events, processing payments, issuing and verifying certificates, tracking
            referral credit, and communicating with you about your account, purchases, or platform updates.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">3. Third-Party Services</h2>
          <p>We rely on a small number of third-party services to operate the Platform:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Razorpay</strong> — payment processing.</li>
            <li><strong>Google</strong> — optional sign-in (Google OAuth).</li>
            <li><strong>Bunny.net</strong> — secure video hosting/streaming for course lectures.</li>
            <li><strong>Vercel &amp; Neon</strong> — application hosting and database infrastructure.</li>
            <li><strong>Google Website Translate</strong> — optional, client-side page translation if you choose to use it.</li>
          </ul>
          <p className="mt-2">
            Each of these providers processes data under their own privacy policies; we only share what's necessary
            for them to perform their function (e.g. Razorpay receives purchase amount and your email for receipts).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">4. Data Retention</h2>
          <p>
            We retain account, purchase, and certificate records for as long as your account is active, and as
            needed to comply with legal, tax, or accounting obligations. Certificate verification records are kept
            indefinitely so certificates remain verifiable.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">5. Your Choices</h2>
          <p>
            You can review and update your account details from your dashboard. To request deletion of your account
            or personal data, or to ask what data we hold about you, email us at{" "}
            <a href="mailto:scholaraura@gmail.com" className="text-brand-600 underline dark:text-brand-400">
              scholaraura@gmail.com
            </a>
            . Note that we may need to retain certain purchase/certificate records even after account deletion for
            legal or verification purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">6. Security</h2>
          <p>
            Passwords are stored using one-way hashing, not in plain text. Access to paid course lectures and
            private event details (venue/Zoom links) is restricted to users with a confirmed purchase or
            registration. No online system is 100% secure, but we take reasonable steps to protect your data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time; continued use of the Platform means you accept the current version.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">8. Contact</h2>
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
