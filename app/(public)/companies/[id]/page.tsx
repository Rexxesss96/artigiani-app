import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";

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
  return { title: company?.businessName ?? "Company not found" };
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
          <Stars rating={average} /> {average.toFixed(1)} ({reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"})
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
            {c.category.name}
          </span>
        ))}
      </div>

      {company.description && <p className="mt-4">{company.description}</p>}
      {company.phone && (
        <p className="mt-2 text-sm text-gray-600">Phone: {company.phone}</p>
      )}

      <section className="mt-8 max-w-lg">
        <h2 className="mb-3 text-lg font-semibold">Request a quote</h2>
        {!ctx.session ? (
          <p className="text-sm">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to request a quote from this company.
          </p>
        ) : isOwnCompany ? (
          <p className="text-sm text-gray-600">This is your company.</p>
        ) : (
          <QuoteRequestForm companyId={company.id} />
        )}
      </section>

      <section className="mt-8 max-w-lg">
        <h2 className="mb-3 text-lg font-semibold">Reviews</h2>

        {eligibility?.canReview && (
          <div className="mb-6">
            <ReviewForm companyId={company.id} />
          </div>
        )}
        {eligibility && !eligibility.canReview && !isOwnCompany && (
          <p className="mb-4 text-sm text-gray-600">{eligibility.reason}</p>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-600">No reviews yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-gray-500">
                    {review.author} ·{" "}
                    {review.createdAt.toLocaleDateString("en-GB")}
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
