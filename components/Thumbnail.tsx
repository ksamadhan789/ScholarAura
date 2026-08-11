export function Thumbnail({
  url,
  alt,
  icon,
}: {
  url?: string | null;
  alt: string;
  icon: string;
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
      className="flex aspect-video w-full items-center justify-center rounded-t-lg bg-gradient-to-br from-brand-50 to-brand-100 text-4xl dark:from-slate-800 dark:to-slate-700"
    >
      {icon}
    </div>
  );
}
