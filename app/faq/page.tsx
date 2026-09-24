import Link from "next/link";
import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { AURA_FAQ, type FaqEntry } from "@/lib/auraFaq";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about courses, certificates, events, competitions, jobs, freelancing, payments and your ScholarAura account.",
};

const GROUPS: { id: FaqEntry["group"]; title: string }[] = [
  { id: "learning", title: "Courses & certificates" },
  { id: "events", title: "Events & competitions" },
  { id: "careers", title: "Jobs, internships & freelance" },
  { id: "account", title: "Account, payments & settings" },
];

// Same entries Aura answers from (lib/auraFaq.ts), so the two never disagree.
export default function FaqPage() {
  return (
    <main>
      <PageHeader eyebrow="Help centre" title="Frequently asked questions">
        Can&apos;t find what you need? Ask Aura (bottom-right) or{" "}
        <Link href="/contact" className="font-medium text-brand-600 underline dark:text-brand-400">
          contact us
        </Link>
        .
      </PageHeader>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12">
        {GROUPS.map((group) => (
          <section key={group.id}>
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">{group.title}</h2>
            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
              {AURA_FAQ.filter((entry) => entry.group === group.id).map((entry) => (
                <details key={entry.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/50">
                    {entry.question}
                    <ChevronDown
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-5 pb-5 text-slate-600 dark:text-slate-300">
                    <p>{entry.answer}</p>
                    {entry.href && (
                      <Link
                        href={entry.href}
                        className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {entry.linkLabel ?? "Learn more"} →
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
