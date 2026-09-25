import Link from "next/link";
import { BadgeCheck, CreditCard, RotateCcw, UserCheck, type LucideIcon } from "lucide-react";

// A thin band under the hero with things that are true of the platform
// itself (not numbers), so it works from day one.
const POINTS: { icon: LucideIcon; title: string; text: string; href?: string }[] = [
  {
    icon: BadgeCheck,
    title: "Verifiable certificates",
    text: "Every certificate has a unique number anyone can check",
    href: "/verify",
  },
  {
    icon: CreditCard,
    title: "Secure payments",
    text: "Processed by Razorpay — we never see your card details",
  },
  {
    icon: UserCheck,
    title: "Reviewed recruiters",
    text: "Every recruiter and every job is approved by our team",
  },
  {
    icon: RotateCcw,
    title: "Clear refund policy",
    text: "Know exactly when you can get your money back",
    href: "/refund-policy",
  },
];

export function HomeTrustPoints() {
  return (
    <section aria-label="Why ScholarAura" className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-4 px-4 py-5 sm:py-6 lg:grid-cols-4">
        {POINTS.map((point) => {
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-800 dark:text-brand-400">
                <point.icon aria-hidden className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{point.title}</span>
                <span className="hidden text-sm text-slate-500 sm:block dark:text-slate-400">{point.text}</span>
              </span>
            </>
          );
          return (
            <li key={point.title}>
              {point.href ? (
                <Link href={point.href} className="group flex items-center gap-3 sm:items-start rounded-lg transition hover:opacity-80">
                  {body}
                </Link>
              ) : (
                <div className="flex items-center gap-3 sm:items-start">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
