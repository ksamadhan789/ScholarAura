import Link from "next/link";

export const PAGE_SIZE = 50;

export function Pagination({
  page,
  totalCount,
  basePath,
  searchParams = {},
}: {
  page: number;
  totalCount: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5"
        >
          ← Previous
        </Link>
      ) : (
        <span className="rounded border border-gray-200 px-3 py-1.5 text-gray-400 dark:border-slate-800 dark:text-slate-600">
          ← Previous
        </span>
      )}
      <span className="text-gray-500 dark:text-slate-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="rounded border border-gray-300 dark:border-slate-600 px-3 py-1.5"
        >
          Next →
        </Link>
      ) : (
        <span className="rounded border border-gray-200 px-3 py-1.5 text-gray-400 dark:border-slate-800 dark:text-slate-600">
          Next →
        </span>
      )}
    </div>
  );
}
