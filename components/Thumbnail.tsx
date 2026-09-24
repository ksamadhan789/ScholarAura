import type { ReactNode } from "react";

export function Thumbnail({
  url,
  alt,
  icon,
}: {
  url?: string | null;
  alt: string;
  /** Shown centred on the placeholder when there's no image — an emoji or an icon element. */
  icon: ReactNode;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={alt} className="aspect-video w-full rounded-t-lg object-cover" />
    );
  }

  return (
    <div
      aria-hidden
      className="flex aspect-video w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-50 via-sky-50 to-brand-100 text-4xl text-brand-500 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 dark:text-brand-400"
    >
      {icon}
    </div>
  );
}
