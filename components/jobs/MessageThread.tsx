"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ThreadMessage = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

export function MessageThread({
  applicationId,
  currentUserId,
  initialMessages,
}: {
  applicationId: string;
  currentUserId: string;
  initialMessages: ThreadMessage[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!body.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/job-applications/${applicationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't send this message.");
        return;
      }

      setBody("");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {initialMessages.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          No messages yet — say hello.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {initialMessages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`max-w-[80%] rounded p-3 text-sm ${
                  isMine
                    ? "self-end bg-brand-600 text-white"
                    : "self-start bg-gray-100 dark:bg-slate-800"
                }`}
              >
                {!isMine && <p className="mb-1 text-xs font-medium opacity-70">{m.senderName}</p>}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={`mt-1 text-xs ${
                    isMine ? "text-white/70" : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="self-start rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
