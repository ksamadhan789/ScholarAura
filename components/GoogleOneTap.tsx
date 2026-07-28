"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptLoadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

// Renders nothing itself — triggers Google's native "Sign in with Google"
// One Tap prompt (top-right corner card) on unauthenticated pages. Falls
// back silently (no-op) if the script fails to load or the browser
// suppresses the prompt; the regular "Continue with Google" OAuth button
// stays as the reliable fallback everywhere this is used.
export function GoogleOneTap({ clientId }: { clientId: string }) {
  const router = useRouter();
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        const accounts = window.google?.accounts;
        if (cancelled || !accounts || initializedRef.current) return;
        initializedRef.current = true;

        accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential: string }) => {
            const result = await signIn("google-one-tap", {
              credential: response.credential,
              redirect: false,
            });
            if (!result?.error) {
              router.push("/dashboard");
              router.refresh();
            }
          },
          use_fedcm_for_prompt: true,
          auto_select: false,
        });

        accounts.id.prompt();
      })
      .catch(() => {
        // Google Identity Services failed to load — the regular OAuth
        // button remains available, nothing further to do here.
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return null;
}
