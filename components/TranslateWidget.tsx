"use client";

import { useEffect } from "react";

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

  return (
    <div className="translate-fab fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <span aria-hidden className="text-base">
        🌐
      </span>
      <div id="google_translate_element" className="translate-widget" />
    </div>
  );
}
