const GRADIENT_BACKGROUND =
  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0), linear-gradient(to bottom right, #1d4ed8, #1e40af, #0f172a)";

/** The big banner atop a listing detail page — a real thumbnail when one exists, the same dot-grid gradient as the homepage hero otherwise. */
export function DetailHero({
  image,
  eyebrow,
  badges,
  title,
  meta,
  actions,
}: {
  image?: string | null;
  eyebrow?: string;
  badges?: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-cover bg-center"
      style={{
        backgroundImage: image ? `url(${image})` : GRADIENT_BACKGROUND,
        backgroundSize: image ? "cover" : "28px 28px, 100% 100%",
      }}
    >
      <div
        className={`px-6 py-10 sm:px-8 sm:py-14 ${
          image ? "bg-gradient-to-t from-black/85 via-black/50 to-black/10" : ""
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {eyebrow && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-white backdrop-blur">
              {eyebrow}
            </span>
          )}
          {badges}
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
            {meta}
          </div>
        )}
        {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
