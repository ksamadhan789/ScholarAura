"use client";

import { useState } from "react";
import Link from "next/link";
import type { Decimal } from "@prisma/client/runtime/library";
import {
  EVENT_TYPE_LABELS,
  EVENT_FORMAT_LABELS,
} from "@/lib/eventLabels";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/jobLabels";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  thumbnailUrl: string | null;
  certificateLogoUrl: string | null;
};

type EventItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  startDate: string | Date;
  fee: Decimal | string | number;
  format: string;
  city: string | null;
  thumbnailUrl: string | null;
};

type CompetitionItem = {
  id: string;
  slug: string;
  title: string;
  submissionDeadline: string | Date;
  fee: Decimal | string | number;
  city: string | null;
  thumbnailUrl: string | null;
};

type JobItem = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  employmentType: string;
  isRemote: boolean;
  location: string;
  salaryRange: string | null;
  companyLogoUrl: string | null;
};

type Tab = "ALL" | "COURSES" | "CONFERENCES" | "FDPS" | "WEBINARS" | "COMPETITIONS" | "JOBS";

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "COURSES", label: "Courses" },
  { key: "CONFERENCES", label: "Conferences" },
  { key: "FDPS", label: "FDPs" },
  { key: "WEBINARS", label: "Webinars" },
  { key: "COMPETITIONS", label: "Competitions" },
  { key: "JOBS", label: "Jobs" },
];

type Card = {
  key: string;
  tab: Tab;
  href: string;
  badge: string;
  title: string;
  imageUrl: string | null;
  icon: string;
  date: string | null;
  location: string | null;
  price: string | null;
  certificate: boolean;
  ctaLabel: string;
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(fee: Decimal | string | number) {
  return Number(fee) === 0 ? "Free" : `₹${fee}`;
}

function CardTile({ card }: { card: Card }) {
  return (
    <Link
      href={card.href}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600"
    >
      {card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imageUrl} alt="" className="aspect-video w-full object-cover" />
      ) : (
        <div
          aria-hidden
          className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-3xl dark:from-slate-700 dark:to-slate-700"
        >
          {card.icon}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <span className="w-fit rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-slate-700 dark:text-brand-300">
          {card.badge}
        </span>
        <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">{card.title}</h3>

        <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
          {card.date && <span>📅 {card.date}</span>}
          {card.location && <span>📍 {card.location}</span>}
          {card.certificate && <span>🎓 Certificate</span>}
        </div>

        <div className="mt-3 flex flex-1 items-end justify-between">
          {card.price && (
            <span className="font-semibold text-slate-900 dark:text-white">{card.price}</span>
          )}
          <span className="ml-auto text-sm font-medium text-brand-600 dark:text-brand-400">
            {card.ctaLabel} →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function OpportunityExplorer({
  courses,
  events,
  competitions,
  jobs,
}: {
  courses: CourseItem[];
  events: EventItem[];
  competitions: CompetitionItem[];
  jobs: JobItem[];
}) {
  const [tab, setTab] = useState<Tab>("ALL");

  const courseCards: Card[] = courses.map((c) => ({
    key: `course-${c.id}`,
    tab: "COURSES",
    href: `/courses/${c.slug}`,
    badge: `Course · ${c.category}`,
    title: c.title,
    imageUrl: c.thumbnailUrl,
    icon: "📚",
    date: null,
    location: null,
    price: formatPrice(c.price),
    certificate: !!c.certificateLogoUrl,
    ctaLabel: "View Details",
  }));

  const eventCards: Card[] = events.map((e) => {
    const eventTab: Tab =
      e.type === "INTERNATIONAL_CONFERENCE" || e.type === "NATIONAL_CONFERENCE"
        ? "CONFERENCES"
        : e.type === "FDP"
          ? "FDPS"
          : e.type === "WEBINAR"
            ? "WEBINARS"
            : "ALL";
    return {
      key: `event-${e.id}`,
      tab: eventTab,
      href: `/events/${e.slug}`,
      badge: EVENT_TYPE_LABELS[e.type] ?? e.type,
      title: e.title,
      imageUrl: e.thumbnailUrl,
      icon: "📅",
      date: formatDate(e.startDate),
      location: e.city ? `${EVENT_FORMAT_LABELS[e.format] ?? e.format} · ${e.city}` : EVENT_FORMAT_LABELS[e.format] ?? e.format,
      price: formatPrice(e.fee),
      certificate: true,
      ctaLabel: "Register",
    };
  });

  const competitionCards: Card[] = competitions.map((c) => ({
    key: `competition-${c.id}`,
    tab: "COMPETITIONS",
    href: `/competitions/${c.slug}`,
    badge: "Competition",
    title: c.title,
    imageUrl: c.thumbnailUrl,
    icon: "🏆",
    date: `Submit by ${formatDate(c.submissionDeadline)}`,
    location: c.city ?? "Online",
    price: formatPrice(c.fee),
    certificate: true,
    ctaLabel: "View Details",
  }));

  const jobCards: Card[] = jobs.map((j) => ({
    key: `job-${j.id}`,
    tab: "JOBS",
    href: `/jobs/${j.slug}`,
    badge: EMPLOYMENT_TYPE_LABELS[j.employmentType] ?? j.employmentType,
    title: `${j.title} · ${j.companyName}`,
    imageUrl: j.companyLogoUrl,
    icon: "💼",
    date: null,
    location: j.isRemote ? "Remote" : j.location,
    price: j.salaryRange,
    certificate: false,
    ctaLabel: "View Details",
  }));

  const allCards = [...courseCards, ...eventCards, ...competitionCards, ...jobCards];
  const visibleCards = tab === "ALL" ? allCards : allCards.filter((c) => c.tab === tab);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
        Discover your next opportunity
      </h2>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visibleCards.length === 0 ? (
        <p className="mt-10 text-center text-gray-500 dark:text-slate-400">
          Nothing published in this category yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => (
            <CardTile key={card.key} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}
