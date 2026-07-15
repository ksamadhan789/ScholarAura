"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: {
          new (options: Record<string, unknown>, elementId: string): unknown;
          InlineLayout: { SIMPLE: unknown };
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
      if (!window.google) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
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

  return <div id="google_translate_element" className="translate-widget" />;
}
