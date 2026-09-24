import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Thumbnail } from "@/components/Thumbnail";

export type CardMeta = { icon: LucideIcon; text: ReactNode };

// The one card used by the course, event, competition and freelance listings:
// 16:9 image (or branded placeholder), badges, a two-line title, icon-led
// detail rows and a footer line (usually the price). `overlay` sits in the
// top-right corner outside the link (e.g. the save/wishlist heart).
export function MediaCard({
  href,
  thumbnailUrl,
  placeholderIcon,
  badges,
  title,
  meta,
  footer,
  overlay,
  highlight = false,
}: {
  href: string;
  thumbnailUrl?: string | null;
  placeholderIcon: ReactNode;
  badges?: ReactNode;
  title: string;
  meta: CardMeta[];
  footer?: ReactNode;
  overlay?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="relative h-full">
      {overlay && <div className="absolute right-3 top-3 z-10">{overlay}</div>}
      <Link
        href={href}
        className={`group flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 ${
          highlight
            ? "border-amber-300 dark:border-amber-700"
            : "border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700"
        }`}
      >
        <Thumbnail url={thumbnailUrl} alt={title} icon={placeholderIcon} />
        <div className="flex flex-1 flex-col p-4">
          {badges && <div className="flex flex-wrap gap-1.5">{badges}</div>}
          <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
            {title}
          </h3>
          {meta.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              {meta.map((m, i) => (
                <li key={i} className="flex items-start gap-2">
                  <m.icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0">{m.text}</span>
                </li>
              ))}
            </ul>
          )}
          {footer && (
            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700 [&:not(:first-child)]:mt-4">
              {footer}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

/** "Free" or "₹1,299" — the standard price label on cards. */
export function formatPrice(amount: unknown): string {
  const n = Number(amount);
  return n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`;
}
