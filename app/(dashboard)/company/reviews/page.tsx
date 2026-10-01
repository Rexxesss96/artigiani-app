"use client";

import { trpc } from "@/lib/trpc";
import { RequireCompany } from "@/components/require-company";
import { Stars } from "@/components/stars";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionaries";

// /company/reviews: the reviews my company received.

function ReviewsList({ companyId }: { companyId: number }) {
  const { dict, locale } = useI18n();
  const { data, isPending } = trpc.reviews.listByCompany.useQuery({
    companyId,
  });

  if (isPending) {
    return <p className="text-muted">{dict.common.loading}</p>;
  }
  if (!data || data.reviews.length === 0) {
    return <p className="card text-muted">{dict.profile.noReviews}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {data.reviews.map((review) => (
        <li key={review.id} className="card">
          <div className="flex items-center justify-between gap-4">
            <Stars
              rating={review.rating}
              label={format(dict.reviewForm.outOfFive, {
                rating: review.rating,
              })}
            />
            <span className="text-xs text-muted">
              {review.author} ·{" "}
              {new Date(review.createdAt).toLocaleDateString(
                dateLocales[locale],
              )}
            </span>
          </div>
          {review.comment && (
            <p className="mt-2 whitespace-pre-line text-sm">{review.comment}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function CompanyReviewsPage() {
  const { dict } = useI18n();
  return (
    <RequireCompany>
      {(myCompany) => (
        <main>
          <h1 className="mb-6 text-2xl font-bold tracking-tight">
            {dict.profile.reviews}
          </h1>
          <ReviewsList companyId={myCompany.id} />
        </main>
      )}
    </RequireCompany>
  );
}
