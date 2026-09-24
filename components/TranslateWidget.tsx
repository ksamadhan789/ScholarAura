"use client";

import { useEffect } from "react";
import { Globe } from "lucide-react";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: {
          new (options: Record<string, unknown>, elementId: string): unknown;
          InlineLayout: { SIMPLE: unknown };
        };
      };
      accounts?: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export function TranslateWidget() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      const translate = window.google?.translate;
      if (!translate) return;
      new translate.TranslateElement(
        {
          pageLanguage: "en",
          layout: translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Lives in the footer's bottom bar (components/Footer.tsx) rather than
  // floating over the page, where it used to cover content on small screens.
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-slate-200">
      <Globe aria-hidden className="h-4 w-4" />
      <div id="google_translate_element" className="translate-widget" />
    </div>
  );
}
