export function StarRating({ value, size = "text-sm" }: { value: number; size?: string }) {
  const rounded = Math.round(value * 2) / 2; // nearest half star

  return (
    <span className={`inline-flex items-center gap-0.5 ${size}`} aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rounded >= star ? 1 : rounded >= star - 0.5 ? 0.5 : 0;
        return (
          <span key={star} aria-hidden className="relative inline-block">
            <span className="text-gray-300 dark:text-slate-600">★</span>
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden text-amber-400"
                style={{ width: `${fill * 100}%` }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
