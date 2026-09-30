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
    return <p className="text-sm text-green-700">{dict.reviewForm.thanks}</p>;
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
            className={`cursor-pointer text-2xl ${
              value <= rating ? "text-yellow-500" : "text-gray-300"
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
        className="w-full rounded border border-gray-300 px-3 py-2"
      />

      {createReview.error && (
        <p className="text-sm text-red-600">{createReview.error.message}</p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || createReview.isPending}
        className="cursor-pointer rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {createReview.isPending
          ? dict.reviewForm.saving
          : dict.reviewForm.publish}
      </button>
    </form>
  );
}
