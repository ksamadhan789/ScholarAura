import type { ReactNode } from "react";

// Two-column body for a listing detail page (course, event, competition,
// job, freelance), below its DetailHero: content on the left, and an action
// card (price + the real register/enroll/apply control) on the right that
// stays in view while scrolling on desktop. On phones the card follows the
// content, as before; the hero's "Register now" link jumps to it (#register).
export function DetailColumns({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 [&>*:first-child]:mt-0">{children}</div>
      {/* On phones the price + buy/register card comes first, right under the
          hero — not after every review, where hardly anyone scrolled to it. */}
      <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-32 lg:self-start">{aside}</aside>
    </div>
  );
}

export function ActionCard({
  label,
  price,
  priceNote,
  children,
  footer,
}: {
  label?: string;
  price?: ReactNode;
  priceNote?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      id="register"
      className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      )}
      {price !== undefined && (
        <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{price}</p>
      )}
      {priceNote && <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{priceNote}</div>}
      <div className="mt-5 flex flex-col gap-3 [&_a.cta]:block [&_a.cta]:text-center">{children}</div>
      {footer && (
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm empty:hidden dark:border-slate-700">
          {footer}
        </div>
      )}
    </div>
  );
}

/** The standard filled button look for links inside an ActionCard. */
export const ACTION_PRIMARY_CLASS =
  "cta rounded-lg bg-brand-600 px-5 py-3 text-center font-semibold text-white shadow-sm transition-colors hover:bg-brand-700";

/** A coloured status line inside an ActionCard ("You're registered", "Entries closed", …). */
export function ActionStatus({ tone, children }: { tone: "success" | "neutral"; children: ReactNode }) {
  return (
    <p
      className={`rounded-lg px-4 py-3 text-sm font-medium ${
        tone === "success"
          ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {children}
    </p>
  );
}
