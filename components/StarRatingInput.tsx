"use client";

import { useState } from "react";

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayed = hovered ?? value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className={`text-2xl leading-none transition-colors ${
            displayed >= star ? "text-amber-400" : "text-gray-300 dark:text-slate-600"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
