"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";
import { StarRatingInput } from "@/components/StarRatingInput";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  user: { name: string };
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CourseReviewSection({
  slug,
  reviews,
  average,
  count,
  isEnrolled,
  currentUserId,
  isAdmin,
}: {
  slug: string;
  reviews: ReviewItem[];
  average: number;
  count: number;
  isEnrolled: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const ownReview = currentUserId ? reviews.find((r) => r.userId === currentUserId) : undefined;
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(ownReview?.rating ?? 0);
  const [comment, setComment] = useState(ownReview?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't save your review. Please try again.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteOwn() {
    setLoading(true);
    try {
      await fetch(`/api/courses/${slug}/reviews`, { method: "DELETE" });
      setRating(0);
      setComment("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteAsAdmin(reviewId: string) {
    if (!window.confirm("Remove this review?")) return;
    await fetch(`/api/admin/course-reviews/${reviewId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-medium">Reviews</h2>

      {count > 0 ? (
        <div className="mb-6 flex items-center gap-3">
          <StarRating value={average} size="text-xl" />
          <span className="font-semibold">{average.toFixed(1)}</span>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            ({count} review{count === 1 ? "" : "s"})
          </span>
        </div>
      ) : (
        <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">No reviews yet.</p>
      )}

      {isEnrolled && currentUserId && (ownReview === undefined || editing) && (
        <form
          onSubmit={submit}
          className="mb-8 flex flex-col gap-3 rounded border border-gray-200 dark:border-slate-700 p-4"
        >
          <p className="text-sm font-medium">
            {ownReview ? "Edit your review" : "Leave a review"}
          </p>
          <StarRatingInput value={rating} onChange={setRating} />
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think of this course? (optional)"
            className="w-full rounded border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-brand-600 transition-colors hover:bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Saving…" : ownReview ? "Save changes" : "Submit review"}
            </button>
            {ownReview && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {isEnrolled && currentUserId && ownReview && !editing && (
        <div className="mb-8 rounded border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your review</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRating(ownReview.rating);
                  setComment(ownReview.comment ?? "");
                  setEditing(true);
                }}
                className="text-sm text-brand-600 underline dark:text-brand-400"
              >
                Edit
              </button>
              <button
                onClick={deleteOwn}
                disabled={loading}
                className="text-sm text-red-600 underline dark:text-red-400 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-2">
            <StarRating value={ownReview.rating} />
          </div>
          {ownReview.comment && (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{ownReview.comment}</p>
          )}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex flex-col gap-4">
          {reviews
            .filter((r) => r.userId !== currentUserId)
            .map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-100 dark:border-slate-800 pb-4 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="text-sm font-medium">{review.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      {formatDate(review.createdAt)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteAsAdmin(review.id)}
                        className="text-xs text-red-600 underline dark:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
