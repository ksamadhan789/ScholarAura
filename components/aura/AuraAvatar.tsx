const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-14 w-14",
};

/** Aura's avatar — a graduation cap, echoing the ScholarAura logo mark (public/favicon-mark.png) so the widget reads as part of the site's own identity rather than a generic chatbot. */
export function AuraAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={`relative flex ${SIZE_CLASSES[size]} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-purple-500 shadow-lg shadow-brand-500/30`}
    >
      <svg viewBox="0 0 24 24" className="h-[64%] w-[64%]" aria-hidden>
        <polygon points="12,4 22,9 12,14 2,9" fill="white" fillOpacity="0.95" />
        <path
          d="M7 10.3v3.1c0 1.7 2.4 3.1 5 3.1s5-1.4 5-3.1v-3.1"
          stroke="white"
          strokeOpacity="0.95"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1="19.3"
          y1="9.3"
          x2="19.3"
          y2="14.2"
          stroke="white"
          strokeOpacity="0.95"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="19.3" cy="15.1" r="1" fill="white" fillOpacity="0.95" />
      </svg>
    </div>
  );
}
