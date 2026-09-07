import Link from "next/link";
import { HeroSignInCard } from "@/components/HeroSignInCard";

type TileItem = {
  id: string;
  imageUrl?: string | null;
};

function TileMosaic({ items, icon }: { items: TileItem[]; icon: string }) {
  const cells = items.slice(0, 4);
  while (cells.length < 4) cells.push({ id: `placeholder-${cells.length}` });

  return (
    <div className="grid grid-cols-2 gap-1">
      {cells.map((item) => (
        <div
          key={item.id}
          className="flex aspect-square items-center justify-center overflow-hidden rounded bg-brand-50 text-xl dark:bg-slate-700"
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>{icon}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function DealTile({
  title,
  subtitle,
  href,
  items,
  icon,
  emptyText,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: TileItem[];
  icon: string;
  emptyText: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
    >
      <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mb-3 text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
      {items.length > 0 ? (
        <TileMosaic items={items} icon={icon} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded bg-slate-50 py-6 text-sm text-gray-400 dark:bg-slate-900 dark:text-slate-500">
          {emptyText}
        </div>
      )}
      <span className="mt-3 text-sm font-medium text-brand-600 dark:text-brand-400">
        See more →
      </span>
    </Link>
  );
}

export function HomeDealsGrid({
  isSignedIn,
  userName,
  freeCourses,
  bundles,
  competitions,
  events,
  jobs,
}: {
  isSignedIn: boolean;
  userName?: string | null;
  freeCourses: { id: string; thumbnailUrl: string | null }[];
  bundles: { id: string; thumbnailUrl: string | null }[];
  competitions: { id: string; thumbnailUrl: string | null }[];
  events: { id: string; thumbnailUrl: string | null }[];
  jobs: { id: string; companyLogoUrl: string | null }[];
}) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2">
          {isSignedIn ? (
            <div className="flex h-full flex-col justify-center">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Welcome back{userName ? `, ${userName}` : ""} 👋
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pick up right where you left off ✨
              </p>
              <Link
                href="/dashboard"
                className="mt-5 inline-block w-fit rounded bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
              >
                Go to your dashboard
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-sm">
              <HeroSignInCard />
            </div>
          )}
        </div>

        <DealTile
          title="Free courses"
          subtitle="Start learning today, no payment needed"
          href="/courses"
          items={freeCourses.map((c) => ({ id: c.id, imageUrl: c.thumbnailUrl }))}
          icon="📘"
          emptyText="No free courses published yet"
        />

        <DealTile
          title="Competitions closing soon"
          subtitle="Submit your entry before the deadline"
          href="/competitions"
          items={competitions.map((c) => ({ id: c.id, imageUrl: c.thumbnailUrl }))}
          icon="🏆"
          emptyText="No competitions open right now"
        />

        <DealTile
          title="New jobs this week"
          subtitle="Fresh openings from our recruiters"
          href="/jobs"
          items={jobs.map((j) => ({ id: j.id, imageUrl: j.companyLogoUrl }))}
          icon="💼"
          emptyText="No jobs posted yet"
        />

        <DealTile
          title="Events near you"
          subtitle="Conferences, webinars & hands-on trainings"
          href="/events"
          items={events.map((e) => ({ id: e.id, imageUrl: e.thumbnailUrl }))}
          icon="📅"
          emptyText="No upcoming events yet"
        />

        <DealTile
          title="Bundle deals"
          subtitle="Save more with a curated learning path"
          href="/bundles"
          items={bundles.map((b) => ({ id: b.id, imageUrl: b.thumbnailUrl }))}
          icon="🎁"
          emptyText="No bundles published yet"
        />
      </div>
    </section>
  );
}
