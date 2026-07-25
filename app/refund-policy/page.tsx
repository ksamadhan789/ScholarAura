export const metadata = {
  title: "Refund Policy | ScholarAura",
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">Refund Policy</h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">Last updated: July 25, 2026</p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <p>
          This Refund Policy applies to paid courses and paid events (international/national conferences, faculty
          development programs, and hands-on trainings) purchased on ScholarAura.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Courses</h2>
          <p>
            You may request a full refund within <strong>7 days of purchase</strong>, provided you have not
            substantially completed the course (i.e. you have not finished all or nearly all lectures and no
            certificate has been issued). Refund requests after 7 days, or after substantial completion, will not be
            granted.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Events</h2>
          <p>
            You may request a full refund if you cancel your registration <strong>at least 7 days before the
            event's start date</strong>. Cancellations made less than 7 days before the event are not eligible for a
            refund, since seats, materials, and logistics are typically finalized close to the event date. If we
            cancel or reschedule an event, you will be offered a full refund or the option to transfer your
            registration.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">How to Request a Refund</h2>
          <p>
            Email{" "}
            <a href="mailto:scholaraura@gmail.com" className="text-brand-600 underline dark:text-brand-400">
              scholaraura@gmail.com
            </a>{" "}
            with your account email and the course or event name. Approved refunds are issued back to your original
            payment method via Razorpay and typically take 5–7 business days to reflect, depending on your bank.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Referral Credit</h2>
          <p>
            If a purchase was partly or fully paid using referral credit, any refund will first return the
            cash portion paid via Razorpay; credit applied to that purchase will be restored to your account balance
            rather than paid out in cash.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Contact</h2>
          <p>
            Questions about this policy can be sent to{" "}
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
