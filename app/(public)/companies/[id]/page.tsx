import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";
import { getDictionary } from "@/lib/i18n/server";
import { categoryName, format } from "@/lib/i18n/dictionaries";
import { dateLocales } from "@/lib/i18n/config";

// cache() makes the two calls below (generateMetadata and the page)
// share ONE database query per request instead of running it twice.
const getCompany = cache(async (companyId: number) => {
  const caller = appRouter.createCaller(await createContext());
  return caller.companies.getById({ id: companyId });
});

function parseId(id: string) {
  const companyId = Number(id);
  return Number.isInteger(companyId) && companyId > 0 ? companyId : null;
}

// Sets the browser tab title to the company name.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const companyId = parseId((await params).id);
  const company = companyId ? await getCompany(companyId) : null;
  const { dict } = await getDictionary();
  return { title: company?.businessName ?? dict.metadata.companyNotFound };
}

// Public Server Component that renders a company's profile page.

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const companyId = parseId((await params).id);
  if (!companyId) {
    notFound();
  }

  const ctx = await createContext();
  const { dict, locale } = ctx;
  const caller = appRouter.createCaller(ctx);
  const company = await getCompany(companyId);

  if (!company) {
    notFound();
  }

  // Is the visitor looking at their own company? Then no quote form.
  const myCompany = ctx.session ? await caller.companies.getMine() : null;
  const isOwnCompany = myCompany?.id === company.id;

  const { average, reviews } = await caller.reviews.listByCompany({
    companyId: company.id,
  });
  const eligibility = ctx.session
    ? await caller.reviews.canReview({ companyId: company.id })
    : null;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{company.businessName}</h1>
      {average !== null && (
        <p className="text-sm">
          <Stars
            rating={average}
            label={format(dict.reviewForm.outOfFive, {
              rating: average.toFixed(1),
            })}
          />{" "}
          {average.toFixed(1)} (
          {reviews.length === 1
            ? dict.profile.reviewCountOne
            : format(dict.profile.reviewCountOther, { count: reviews.length })}
          )
        </p>
      )}
      <p className="text-gray-600">
        {company.address}, {company.city}, ({company.province}){" "}
        {company.postalCode}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {company.categories.map((c) => (
          <span
            key={c.categoryId}
            className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-800"
          >
            {categoryName(dict, c.category)}
          </span>
        ))}
      </div>

      {company.description && <p className="mt-4">{company.description}</p>}
      {company.phone && (
        <p className="mt-2 text-sm text-gray-600">
          {format(dict.profile.phone, { phone: company.phone })}
        </p>
      )}

      <section className="mt-8 max-w-lg">
        <h2 className="mb-3 text-lg font-semibold">
          {dict.profile.requestQuote}
        </h2>
        {!ctx.session ? (
          <p className="text-sm">
            <Link href="/login" className="underline">
              {dict.profile.loginLink}
            </Link>{" "}
            {dict.profile.loginToRequest}
          </p>
        ) : isOwnCompany ? (
          <p className="text-sm text-gray-600">{dict.profile.yourCompany}</p>
        ) : (
          <QuoteRequestForm companyId={company.id} />
        )}
      </section>

      <section className="mt-8 max-w-lg">
        <h2 className="mb-3 text-lg font-semibold">{dict.profile.reviews}</h2>

        {eligibility?.canReview && (
          <div className="mb-6">
            <ReviewForm companyId={company.id} />
          </div>
        )}
        {eligibility && !eligibility.canReview && !isOwnCompany && (
          <p className="mb-4 text-sm text-gray-600">
            {dict.profile[eligibility.reason]}
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-600">{dict.profile.noReviews}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <Stars
                    rating={review.rating}
                    label={format(dict.reviewForm.outOfFive, {
                      rating: review.rating,
                    })}
                  />
                  <span className="text-xs text-gray-500">
                    {review.author} ·{" "}
                    {review.createdAt.toLocaleDateString(dateLocales[locale])}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 whitespace-pre-line text-sm">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
