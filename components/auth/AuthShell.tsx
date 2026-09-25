import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type AuthBenefit = { icon: LucideIcon; title: string; text: string };

/** Shared input look for the sign-in / sign-up forms. */
export const AUTH_INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

export const AUTH_LABEL_CLASS = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";

export const AUTH_PRIMARY_BUTTON_CLASS =
  "w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50";

/**
 * Layout for /login, /register and /recruiter/register: on desktop a navy
 * brand panel (headline + benefits) beside the form card; on phones just the
 * card. Every benefit must be literally true of the product.
 */
export function AuthShell({
  eyebrow,
  headline,
  benefits,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  headline: string;
  benefits: AuthBenefit[];
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16">
        <section
          className="relative hidden overflow-hidden rounded-3xl bg-navy-900 p-10 text-white lg:block"
          aria-label="Why ScholarAura"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.18) 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"
          />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">{headline}</h2>
            <ul className="mt-8 space-y-5">
              {benefits.map((b) => (
                <li key={b.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                    <b.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{b.title}</span>
                    <span className="block text-sm text-slate-300">{b.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <div className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-6 space-y-2 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
        </div>
      </div>
    </main>
  );
}

/** "Continue with Google" button with the multicolour G. */
export function GoogleButton({ onClick, label = "Continue with Google" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.5 26.9 35.5 24 35.5c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.5 36.6 44 30.9 44 24c0-1.3-.1-2.6-.4-3.5z"
        />
      </svg>
      {label}
    </button>
  );
}

export function AuthDivider({ label = "or with email" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
      {label}
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
    </div>
  );
}
