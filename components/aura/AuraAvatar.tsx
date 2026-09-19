const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-14 w-14",
};

/** Aura's avatar — a friendly person silhouette, not a robot, so the widget reads as a helpful guide rather than an automated bot. */
export function AuraAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={`relative flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/30`}
    >
      <svg viewBox="0 0 24 24" className="h-[68%] w-[68%]" aria-hidden>
        <circle cx="12" cy="8.5" r="4" fill="white" fillOpacity="0.95" />
        <path
          d="M3.5 21.5c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5"
          fill="white"
          fillOpacity="0.95"
        />
      </svg>
    </div>
  );
}
