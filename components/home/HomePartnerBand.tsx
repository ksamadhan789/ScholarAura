import Link from "next/link";
import { Building2, CalendarDays } from "lucide-react";

// Closing homepage band for the other side of the marketplace — recruiters
// and event/competition organisers.
export function HomePartnerBand() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 pb-16">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-navy-900 p-8 text-white">
          <Building2 aria-hidden className="h-8 w-8 text-sky-300" />
          <h2 className="mt-4 text-2xl font-bold">Hiring? Reach students and professionals</h2>
          <p className="mt-2 text-slate-300">
            Post jobs and internships, review applications and message candidates — all from your
            recruiter dashboard.
          </p>
          <Link
            href="/recruiter/register"
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-2.5 font-semibold text-navy-900 transition-colors hover:bg-slate-100"
          >
            Post a job
          </Link>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-sky-500 p-8 text-white">
          <CalendarDays aria-hidden className="h-8 w-8 text-white/90" />
          <h2 className="mt-4 text-2xl font-bold">Organising an event or competition?</h2>
          <p className="mt-2 text-white/90">
            List conferences, FDPs, workshops and competitions with registration, payments and
            automatic certificates.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-700 transition-colors hover:bg-slate-100"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
