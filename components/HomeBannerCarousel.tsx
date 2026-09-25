"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, Pause, Play, Trophy } from "lucide-react";
import { Thumbnail } from "@/components/Thumbnail";

export type BannerItem = {
  key: string;
  href: string;
  badge: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  thumbnailUrl: string | null;
  kind: "course" | "event" | "competition";
};

// Placeholder art for items without a thumbnail (a string key, since icon
// components can't be passed from the server page to this client component).
const KIND_ICONS = { course: BookOpen, event: CalendarDays, competition: Trophy } as const;

export function HomeBannerCarousel({ items }: { items: BannerItem[] }) {
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);

  if (items.length === 0) return null;

  const paused = userPaused || interacting;
  const track = [...items, ...items];

  return (
    <section className="border-b border-slate-200 bg-slate-50 py-6 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mx-auto max-w-[1600px] px-4">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Featured on ScholarAura
        </h2>

        <div className="relative overflow-hidden rounded-xl">
          <div
            className={`flex w-max gap-4 animate-home-banner ${paused ? "home-banner-paused" : ""}`}
            onPointerDown={() => setInteracting(true)}
            onPointerUp={() => setInteracting(false)}
            onPointerCancel={() => setInteracting(false)}
            onPointerLeave={() => setInteracting(false)}
          >
            {track.map((item, i) => (
              <Link
                key={`${item.key}-${i}`}
                href={item.href}
                className="group relative block w-64 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-transform hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 sm:w-72"
              >
                <Thumbnail
                  url={item.thumbnailUrl}
                  alt={item.title}
                  icon={(() => {
                    const Icon = KIND_ICONS[item.kind];
                    return <Icon className="h-10 w-10" strokeWidth={1.5} />;
                  })()}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                  <span className="inline-block rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
                    {item.badge}
                  </span>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-white/80">
                    {item.subtitle} · {item.priceLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-pressed={userPaused}
            aria-label={userPaused ? "Play featured carousel" : "Pause featured carousel"}
            className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
          >
            {userPaused ? <Play aria-hidden className="h-4 w-4" /> : <Pause aria-hidden className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
