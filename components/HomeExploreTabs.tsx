"use client";

import { useState } from "react";
import Link from "next/link";
import type { Decimal } from "@prisma/client/runtime/library";
import { Badge } from "@/components/Badge";
import { EVENT_TYPE_LABELS, EVENT_TYPE_TABS, formatDateRange } from "@/lib/eventLabels";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: Decimal | string | number;
  instructor: { name: string };
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

type TabKey = "courses" | (typeof EVENT_TYPE_TABS)[number]["type"];
type EventSubTab = "upcoming" | "ongoing";

export function HomeExploreTabs({
  courses,
  events,
}: {
  courses: CourseItem[];
  events: EventItem[];
}) {
  const [tab, setTab] = useState<TabKey>("courses");
  const [subTab, setSubTab] = useState<EventSubTab>("upcoming");

  const now = new Date();
  const eventsForTab = tab === "courses" ? [] : events.filter((e) => e.type === tab);
  const ongoingEvents = eventsForTab.filter(
    (e) => new Date(e.startDate) <= now && new Date(e.endDate) >= now
  );
  const upcomingEvents = eventsForTab.filter((e) => new Date(e.startDate) > now);
  const visibleEvents = subTab === "upcoming" ? upcomingEvents : ongoingEvents;

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
          Courses
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
      </div>

      {tab !== "courses" && (
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
            No courses published yet.
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
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {Number(course.price) === 0 ? "Free" : `₹${course.price}`}
                </p>
              </Link>
            ))}
          </div>
        )
      ) : visibleEvents.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-slate-400">
          No {subTab} {activeEventLabel?.toLowerCase()} right now.
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
          href={tab === "courses" ? "/courses" : `/events?type=${tab}`}
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          View all {tab === "courses" ? "courses" : activeEventLabel?.toLowerCase()} →
        </Link>
      </div>
    </section>
  );
}
