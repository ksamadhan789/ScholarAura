"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { AuraAvatar } from "@/components/aura/AuraAvatar";
import { SupportTicketForm } from "@/components/aura/SupportTicketForm";
import type { AuraResponse, AuraResultSection } from "@/lib/auraSearch";

const SUGGESTED_PROMPTS = [
  "Find a course",
  "Find a job",
  "How do certificates work?",
  "How do I get a refund?",
];

type Exchange = { query: string; response: AuraResponse };

function ResultSections({ sections }: { sections: AuraResultSection[] }) {
  const withItems = sections.filter((s) => s.items.length > 0);
  if (withItems.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {withItems.map((section) => (
        <section key={section.label}>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {section.label}
          </h3>
          <div className="flex flex-col gap-1.5">
            {section.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-lg border border-gray-200 p-2.5 text-sm transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-slate-800"
              >
                <Badge variant="brand">{item.badge}</Badge>
                <p className="mt-1 font-medium text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const GREETING_DISMISSED_KEY = "aura-greeting-dismissed";

export function AuraWidget() {
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [input, setInput] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) return;
    try {
      if (localStorage.getItem(GREETING_DISMISSED_KEY) === "1") return;
    } catch {
      // Private browsing / blocked storage — just show the greeting every time.
    }
    const timer = setTimeout(() => setShowGreeting(true), 1500);
    return () => clearTimeout(timer);
  }, [open]);

  function dismissGreeting() {
    setShowGreeting(false);
    try {
      localStorage.setItem(GREETING_DISMISSED_KEY, "1");
    } catch {
      // Ignore — worst case the greeting reappears next visit.
    }
  }

  function openFromGreeting() {
    dismissGreeting();
    setOpen(true);
  }

  async function ask(query: string) {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`/api/aura?q=${encodeURIComponent(trimmed)}`);
      const response: AuraResponse = await res.json();
      setExchanges((prev) => [...prev, { query: trimmed, response }]);
    } catch {
      setExchanges((prev) => [
        ...prev,
        {
          query: trimmed,
          response: {
            faqAnswer: { keywords: [], answer: "Couldn't reach the server — please try again." },
            resultSections: [],
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
  }

  if (!open) {
    return (
      <>
        {showGreeting && (
          <div className="fixed bottom-24 right-4 z-50 flex max-w-[240px] items-start gap-2 rounded-2xl rounded-br-sm border border-gray-200 bg-white py-2.5 pl-2.5 pr-7 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <AuraAvatar size="sm" />
            <button
              type="button"
              onClick={openFromGreeting}
              className="text-left text-sm text-slate-700 dark:text-slate-200"
            >
              👋 Hi, I&rsquo;m Aura! How can I help you?
            </button>
            <button
              type="button"
              onClick={dismissGreeting}
              aria-label="Dismiss"
              className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" />
              </svg>
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={openFromGreeting}
          aria-label="Open Aura"
          className="fixed bottom-4 right-4 z-50 transition-transform hover:scale-105"
        >
          <AuraAvatar size="lg" />
        </button>
      </>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[32rem] max-h-[calc(100vh-2rem)] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 p-3 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <AuraAvatar size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Aura</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Your ScholarAura guide</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/aura"
            className="rounded p-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Open full page"
          >
            ⤢
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close Aura"
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="flex items-start gap-2">
          <AuraAvatar size="sm" />
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            👋 Hi, I&rsquo;m Aura! Ask me to find something on ScholarAura, or how a feature works.
          </div>
        </div>

        {exchanges.length === 0 && (
          <div className="ml-10 flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {exchanges.map((exchange, i) => {
          const { faqAnswer, resultSections } = exchange.response;
          const totalResults = resultSections.reduce((sum, s) => sum + s.items.length, 0);
          return (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-sm text-white">
                  {exchange.query}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AuraAvatar size="sm" />
                <div className="flex max-w-[85%] flex-col gap-2.5">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {faqAnswer
                      ? faqAnswer.answer
                      : totalResults > 0
                        ? `Here's what I found for "${exchange.query}":`
                        : `Hmm, I couldn't find anything for "${exchange.query}".`}
                  </div>
                  {faqAnswer?.href && (
                    <Link
                      href={faqAnswer.href}
                      className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                    >
                      {faqAnswer.linkLabel ?? "Learn more"} →
                    </Link>
                  )}
                  <ResultSections sections={resultSections} />
                  {!faqAnswer && totalResults === 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href="/courses"
                        className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Browse courses
                      </Link>
                      <Link
                        href="/events"
                        className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Browse events
                      </Link>
                      <Link
                        href="/jobs"
                        className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Browse jobs
                      </Link>
                    </div>
                  )}
                  {!faqAnswer && totalResults === 0 && <SupportTicketForm query={exchange.query} />}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2">
            <AuraAvatar size="sm" />
            <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              …
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Aura anything..."
          className="min-w-0 flex-1 rounded-full border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M2.94 2.94a1.5 1.5 0 0 1 1.61-.34l12.5 5a1.5 1.5 0 0 1 0 2.8l-12.5 5a1.5 1.5 0 0 1-2.03-1.83L3.9 10 2.52 4.77a1.5 1.5 0 0 1 .42-1.83Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
