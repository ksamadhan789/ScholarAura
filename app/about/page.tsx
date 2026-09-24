import Link from "next/link";
import type { Metadata } from "next";
import { Award, BookOpen, Briefcase, CalendarDays, Laptop, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description:
    "ScholarAura brings courses, academic events, competitions, jobs, internships and freelance work together in one place for students and professionals.",
};

const OFFERINGS = [
  { icon: BookOpen, title: "Courses", text: "Video courses with quizzes, downloadable resources and a certificate when you finish.", href: "/courses" },
  { icon: CalendarDays, title: "Events", text: "Conferences, faculty development programs, hands-on trainings, webinars and alumni meets — online and in person.", href: "/events" },
  { icon: Trophy, title: "Competitions", text: "Individual and team competitions with prizes and certificates for participants and winners.", href: "/competitions" },
  { icon: Briefcase, title: "Jobs & internships", text: "Academic and professional roles from verified recruiters, with applications and messaging built in.", href: "/jobs" },
  { icon: Laptop, title: "Freelance", text: "Offer your own skills — design, tutoring, development and more — or find someone who can help.", href: "/freelance" },
  { icon: Award, title: "Verifiable certificates", text: "Every certificate has a unique number anyone can check publicly.", href: "/verify" },
];

export default function AboutPage() {
  return (
    <main>
      <PageHeader eyebrow="About us" title="One place to learn, take part and get hired">
        ScholarAura is an academic and professional platform for students, faculty and working
        professionals, built primarily for India.
      </PageHeader>

      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">What you can do here</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERINGS.map((o) => (
            <Link
              key={o.title}
              href={o.href}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-700 dark:text-brand-400">
                <o.icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                {o.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{o.text}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl bg-navy-900 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Hiring or organising an event?</h2>
            <p className="mt-1 text-slate-300">Post jobs as a recruiter, or get in touch to list your event or competition.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/recruiter/register" className="rounded-lg bg-white px-4 py-2 font-semibold text-navy-900 hover:bg-slate-100">
              For employers
            </Link>
            <Link href="/contact" className="rounded-lg border border-white/30 px-4 py-2 font-semibold hover:bg-white/10">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
