"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewFreelanceListingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [rate, setRate] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [contactEmail, setContactEmail] = useState(session?.user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/freelance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          description,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 10),
          rate: rate || undefined,
          portfolioUrl: portfolioUrl || undefined,
          contactEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't post your listing. Please try again.");
        return;
      }

      router.push("/dashboard/freelance");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Post your freelance services</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        Listed under your name — visible to everyone browsing /freelance as soon as you post.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            type="text"
            required
            placeholder="e.g. I design clean, modern logos"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <input
            type="text"
            required
            placeholder="e.g. Graphic Design, Web Development, Tutoring"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={5}
            placeholder="What you offer, your experience, and what makes you a good fit..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Skills <span className="font-normal text-gray-400 dark:text-slate-500">(optional, comma-separated)</span>
          </label>
          <input
            type="text"
            placeholder="Figma, Illustrator, Branding"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Rate <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. ₹500/hr or ₹5,000 per project"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Portfolio link <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Contact email</label>
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Shown to anyone who clicks &ldquo;Contact&rdquo; on your listing.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post listing"}
        </button>
      </form>
    </main>
  );
}
