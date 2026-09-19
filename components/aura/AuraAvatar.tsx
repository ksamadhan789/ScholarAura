const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-14 w-14",
};

/** Aura's avatar — a robot face, so it reads clearly as an automated assistant. */
export function AuraAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={`relative flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/30`}
    >
      <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" aria-hidden>
        <line x1="12" y1="3" x2="12" y2="6" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="2.4" r="1.3" fill="white" />
        <rect x="4" y="6" width="16" height="13" rx="4" fill="white" fillOpacity="0.97" />
        <circle cx="9" cy="12.3" r="1.6" fill="#2563eb" />
        <circle cx="15" cy="12.3" r="1.6" fill="#2563eb" />
        <rect x="8.3" y="15.6" width="7.4" height="1.5" rx="0.75" fill="#2563eb" />
      </svg>
    </div>
  );
}
