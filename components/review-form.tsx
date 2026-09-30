"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import { format } from "@/lib/i18n/dictionaries";

// Client Component for leaving a review. After saving, router.refresh()
// asks the server to re-render the profile page (a Server Component),
// so the new review and the new average appear without a full reload.

export function ReviewForm({ companyId }: { companyId: number }) {
  const router = useRouter();
  const { dict } = useI18n();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => router.refresh(),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createReview.mutate({
      companyId,
      rating,
      comment: comment || undefined,
    });
  }

  if (createReview.isSuccess) {
    return <p className="success-text">{dict.reviewForm.thanks}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label={dict.reviewForm.rating}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={
              value === 1
                ? dict.reviewForm.starOne
                : format(dict.reviewForm.starOther, { count: value })
            }
            onClick={() => setRating(value)}
            className={`cursor-pointer text-3xl transition hover:scale-110 ${
              value <= rating
                ? "text-amber-500"
                : "text-stone-300 dark:text-stone-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={dict.reviewForm.placeholder}
        maxLength={1000}
        rows={3}
        className="input"
      />

      {createReview.error && (
        <p className="error-text">{createReview.error.message}</p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || createReview.isPending}
        className="btn btn-primary"
      >
        {createReview.isPending
          ? dict.reviewForm.saving
          : dict.reviewForm.publish}
      </button>
    </form>
  );
}
