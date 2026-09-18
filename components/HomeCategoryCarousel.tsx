"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HomeCategory } from "@/lib/homeCategories";

export type HomeCategoryItem = HomeCategory & { count?: number };

const GRADIENT_BACKGROUND =
  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0), linear-gradient(to bottom right, #1d4ed8, #1e40af, #0f172a)";

// Plays a category's clip only once its card scrolls into the viewport, and
// pauses it again once it scrolls out — with ~11 cards, autoplaying every
// clip at once on page load would be wasteful bandwidth and battery for
// videos the visitor may never scroll to. Skipped entirely for
// prefers-reduced-motion or a save-data connection, falling back to the
// image/icon panel instead.
function CategoryMedia({ category }: { category: HomeCategoryItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAllowed, setVideoAllowed] = useState(false);

  useEffect(() => {
    if (!category.video) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    setVideoAllowed(!prefersReducedMotion && !connection?.saveData);
  }, [category.video]);

  useEffect(() => {
    if (!videoAllowed) return;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [videoAllowed]);

  const showVideo = Boolean(category.video) && videoAllowed;
  const showImage = !showVideo && Boolean(category.image);

  return (
    <div
      ref={containerRef}
      className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden sm:h-44"
      style={
        showVideo || showImage
          ? undefined
          : { backgroundImage: GRADIENT_BACKGROUND, backgroundSize: "28px 28px, 100% 100%" }
      }
    >
      {showVideo ? (
        <video
          ref={videoRef}
          src={category.video}
          poster={category.image}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="text-5xl transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        >
          {category.icon}
        </span>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white backdrop-blur">
        {category.eyebrow}
      </span>
      {typeof category.count === "number" && category.count > 0 && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
          {category.count} {category.statLabel}
        </span>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: HomeCategoryItem }) {
  return (
    <Link
      href={category.href}
      data-category-card
      role="listitem"
      className="group flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-800 sm:w-64 md:w-72"
    >
      <CategoryMedia category={category} />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{category.title}</h3>
        <p className="flex-1 text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-brand-400 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          {category.cta} <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}

export function HomeCategoryCarousel({ categories }: { categories: HomeCategoryItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByCards(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-category-card]");
    const amount = (card?.offsetWidth ?? el.clientWidth * 0.8) + 16;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: amount * direction, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (categories.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-white py-10 dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Explore ScholarAura</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Discover courses, competitions, events, career opportunities and more — all in one
              academic ecosystem.
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canScrollPrev}
              aria-label="Previous categories"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span aria-hidden>←</span>
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canScrollNext}
              aria-label="Next categories"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          role="list"
          aria-label="ScholarAura categories"
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 no-scrollbar"
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
