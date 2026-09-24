import Link from "next/link";
import type { Metadata } from "next";
import { Building2, CircleHelp, Mail, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get help with ScholarAura, or get in touch about hiring, events and partnerships.",
};

// Same public address as the site-wide Organization schema in app/layout.tsx.
const SUPPORT_EMAIL = "scholaraura@gmail.com";

const OPTIONS = [
  {
    icon: CircleHelp,
    title: "Quick answers",
    text: "Most questions are answered in our FAQ — or ask Aura, the help assistant in the bottom-right corner. If Aura can't help, it lets you raise a support ticket.",
    link: { href: "/faq", label: "Read the FAQ" },
  },
  {
    icon: Mail,
    title: "Email us",
    text: "For anything else — payments, certificates, partnerships or listing your event — email our team.",
    link: { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
  },
  {
    icon: Building2,
    title: "Recruiters",
    text: "Create a recruiter account to post jobs and internships. Accounts are approved by our team.",
    link: { href: "/recruiter/register", label: "Register as a recruiter" },
  },
  {
    icon: ShieldCheck,
    title: "Verify a certificate",
    text: "Employers and colleges can check any ScholarAura certificate by its certificate number.",
    link: { href: "/verify", label: "Verify a certificate" },
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageHeader eyebrow="Contact" title="We're here to help">
        Choose the option that fits — we usually reply by email.
      </PageHeader>

      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-12 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <div
            key={o.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700 dark:text-brand-400">
              <o.icon aria-hidden className="h-5 w-5" />
            </span>
            <h2 className="font-semibold text-slate-900 dark:text-white">{o.title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{o.text}</p>
            <Link
              href={o.link.href}
              className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {o.link.label} →
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
