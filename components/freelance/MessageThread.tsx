"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { MessageCircle, Send } from "lucide-react";

export type ThreadMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoFileId: string | null;
  body: string;
  createdAt: string;
};

export function MessageThread({
  threadId,
  currentUserId,
  initialMessages,
}: {
  threadId: string;
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
      const res = await fetch(`/api/freelance/threads/${threadId}/messages`, {
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {initialMessages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <MessageCircle aria-hidden className="h-8 w-8 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet — say hello.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 bg-slate-50/60 p-4 sm:p-5 dark:bg-slate-900/30">
          {initialMessages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex max-w-[80%] items-end gap-2 ${isMine ? "self-end" : "self-start"}`}>
                {!isMine && (
                  <Avatar
                    name={m.senderName}
                    src={
                      m.senderPhotoFileId
                        ? `/api/freelance/threads/${threadId}/messages/photo?userId=${m.senderId}`
                        : null
                    }
                    size={28}
                  />
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    isMine
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {!isMine && <p className="mb-1 text-xs font-medium opacity-70">{m.senderName}</p>}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-xs ${isMine ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>
                    {new Date(m.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:p-5 dark:border-slate-700"
      >
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          aria-label="Your message"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="inline-flex items-center gap-1.5 self-end rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          <Send aria-hidden className="h-4 w-4" />
          {loading ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
