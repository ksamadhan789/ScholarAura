"use client";

import { useState } from "react";
import Link from "next/link";
import type { Decimal } from "@prisma/client/runtime/library";
import { Badge } from "@/components/Badge";
import { StarRating } from "@/components/StarRating";
import { EVENT_TYPE_LABELS, EVENT_TYPE_TABS, formatDateRange } from "@/lib/eventLabels";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/jobLabels";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  instructor: { name: string };
  rating: { average: number; count: number } | null;
};

type EventItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  startDate: string | Date;
  endDate: string | Date;
  fee: Decimal | string | number;
};

type CompetitionItem = {
  id: string;
  slug: string;
  title: string;
  submissionDeadline: string | Date;
  fee: Decimal | string | number;
};

type JobItem = {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  employmentType: string;
  isRemote: boolean;
  location: string;
};

function EventCard({ event }: { event: EventItem }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Badge variant="brand">{EVENT_TYPE_LABELS[event.type]}</Badge>
      <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{event.title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
        {formatDateRange(new Date(event.startDate), new Date(event.endDate))}
      </p>
      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
        {Number(event.fee) === 0 ? "Free" : `₹${event.fee}`}
      </p>
    </Link>
  );
}

function CompetitionCard({ competition }: { competition: CompetitionItem }) {
  return (
    <Link
      href={`/competitions/${competition.slug}`}
      className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Badge variant="brand">Competition</Badge>
      <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{competition.title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
        Submit by{" "}
        {new Date(competition.submissionDeadline).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
      <p className="mt-2 font-semibold text-slate-900 dark:text-white">
        {Number(competition.fee) === 0 ? "Free" : `₹${competition.fee}`}
      </p>
    </Link>
  );
}

function JobCard({ job }: { job: JobItem }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
    >
      <Badge variant="brand">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
      <h3 className="mt-2 font-medium text-slate-900 dark:text-white">{job.title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{job.companyName}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
        {job.isRemote ? "Remote" : job.location}
      </p>
    </Link>
  );
}

type TabKey = "courses" | "competitions" | "jobs" | (typeof EVENT_TYPE_TABS)[number]["type"];
type EventSubTab = "upcoming" | "ongoing";

export function HomeExploreTabs({
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
  const [tab, setTab] = useState<TabKey>("courses");
  const [subTab, setSubTab] = useState<EventSubTab>("upcoming");

  const isEventTab = tab !== "courses" && tab !== "competitions" && tab !== "jobs";
  const now = new Date();
  const eventsForTab = isEventTab ? events.filter((e) => e.type === tab) : [];
  const ongoingEvents = eventsForTab.filter(
    (e) => new Date(e.startDate) <= now && new Date(e.endDate) >= now
  );
  const upcomingEvents = eventsForTab.filter((e) => new Date(e.startDate) > now);
  const visibleEvents = subTab === "upcoming" ? upcomingEvents : ongoingEvents;
  const openCompetitions = competitions.filter((c) => new Date(c.submissionDeadline) >= now);

  const activeEventLabel = EVENT_TYPE_TABS.find((t) => t.type === tab)?.label;

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setTab("courses")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "courses"
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          📚 Courses
        </button>
        <button
          onClick={() => setTab("competitions")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "competitions"
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          🏆 Competitions
        </button>
        {EVENT_TYPE_TABS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setTab(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === type
                ? "bg-brand-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setTab("jobs")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "jobs"
              ? "bg-brand-600 text-white"
              : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          💼 Jobs
        </button>
      </div>

      {isEventTab && (
        <div className="mb-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setSubTab("upcoming")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              subTab === "upcoming"
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setSubTab("ongoing")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              subTab === "ongoing"
                ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            Ongoing ({ongoingEvents.length})
          </button>
        </div>
      )}

      {tab === "courses" ? (
        courses.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-slate-400">
            👀 No courses published yet — check back soon!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <Badge variant="brand">{course.category}</Badge>
                <h3 className="mt-2 font-medium text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  By {course.instructor.name}
                </p>
                {course.rating && course.rating.count > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <StarRating value={course.rating.average} />
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {course.rating.average.toFixed(1)} ({course.rating.count})
                    </span>
                  </div>
                )}
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
                </p>
              </Link>
            ))}
          </div>
        )
      ) : tab === "competitions" ? (
        openCompetitions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-slate-400">
            👀 No competitions open for entries right now — stay tuned!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {openCompetitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        )
      ) : tab === "jobs" ? (
        jobs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-slate-400">
            👀 No jobs posted yet — check back soon!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )
      ) : visibleEvents.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-slate-400">
          👀 No {subTab} {activeEventLabel?.toLowerCase()} right now — stay tuned!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href={
            tab === "courses"
              ? "/courses"
              : tab === "competitions"
                ? "/competitions"
                : tab === "jobs"
                  ? "/jobs"
                  : `/events?type=${tab}`
          }
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          View all{" "}
          {tab === "courses"
            ? "courses"
            : tab === "competitions"
              ? "competitions"
              : tab === "jobs"
                ? "jobs"
                : activeEventLabel?.toLowerCase()}{" "}
          →
        </Link>
      </div>
    </section>
  );
}
