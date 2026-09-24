import Link from "next/link";
import { TranslateWidget } from "./TranslateWidget";
import { MAIN_NAV_ITEMS } from "@/lib/navItems";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Explore",
    links: MAIN_NAV_ITEMS.map(({ href, label }) => ({ href, label })),
  },
  {
    title: "For you",
    links: [
      { href: "/dashboard", label: "My dashboard" },
      { href: "/dashboard/certificates", label: "My certificates" },
      { href: "/dashboard/referrals", label: "Refer & earn" },
      { href: "/verify", label: "Verify a certificate" },
      { href: "/recruiter/register", label: "For employers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/aura", label: "Ask Aura" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy-900 text-slate-300">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon-mark.png" alt="" aria-hidden="true" className="h-8 w-8 invert" />
            ScholarAura
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            Courses, academic events, competitions, jobs, internships and freelance work — one
            place to learn, take part and get hired.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    // Dashboard pages redirect signed-out visitors to /login;
                    // prefetching them while signed out would cache that
                    // redirect and replay it right after signing in.
                    prefetch={link.href.startsWith("/dashboard") ? false : undefined}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-slate-400">
          {/* Language picker on the left — the right corner is taken by the
              floating Aura chat button. */}
          <TranslateWidget />
          <p>© {new Date().getFullYear()} ScholarAura. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
