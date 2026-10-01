import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";
import { CompanyAvatar } from "@/components/company-avatar";
import { CompanyMap } from "@/components/company-map";
import Image from "next/image";
import { uploadUrl } from "@/lib/uploads";
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

  // Coordinates are stored as text: convert and check they are real numbers.
  const latitude = Number(company.latitude);
  const longitude = Number(company.longitude);
  const hasMap =
    company.latitude !== null &&
    company.longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const ratingLabel = (rating: number | string) =>
    format(dict.reviewForm.outOfFive, { rating });

  return (
    <main className="container-page">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------- Left column: who they are + reviews ---------- */}
        <div className="flex flex-col gap-6">
          <section className="card">
            <div className="flex items-start gap-4">
              <CompanyAvatar
                name={company.businessName}
                logoFile={company.logoFile}
                size="lg"
              />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">
                  {company.businessName}
                </h1>
                <p className="text-muted">
                  {company.city} ({company.province})
                </p>
                {average !== null && (
                  <p className="mt-1 flex items-center gap-1 text-sm">
                    <Stars
                      rating={average}
                      label={ratingLabel(average.toFixed(1))}
                    />
                    <span className="font-medium">{average.toFixed(1)}</span>
                    <span className="text-muted">
                      (
                      {reviews.length === 1
                        ? dict.profile.reviewCountOne
                        : format(dict.profile.reviewCountOther, {
                            count: reviews.length,
                          })}
                      )
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {company.categories.map((c) => (
                <span key={c.categoryId} className="chip">
                  {categoryName(dict, c.category)}
                </span>
              ))}
            </div>

            {company.description && (
              <>
                <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
                  {dict.profile.about}
                </h2>
                <p className="mt-2 whitespace-pre-line">
                  {company.description}
                </p>
              </>
            )}
          </section>

          {company.photos.length > 0 && (
            <section className="card">
              <h2 className="text-lg font-semibold">{dict.profile.gallery}</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {company.photos.map((photo) => (
                  <li key={photo.id}>
                    {/* A link to the full-size image, opened in a new tab */}
                    <a
                      href={uploadUrl(photo.fileName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block aspect-square overflow-hidden rounded-xl border border-border"
                    >
                      <Image
                        src={uploadUrl(photo.fileName)}
                        alt={format(dict.profile.photoAlt, {
                          name: company.businessName,
                        })}
                        fill
                        sizes="(min-width: 640px) 240px, 50vw"
                        className="object-cover transition hover:scale-105"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2 className="text-lg font-semibold">{dict.profile.reviews}</h2>

            {eligibility?.canReview && (
              <div className="mt-4 rounded-xl bg-background p-4">
                <ReviewForm companyId={company.id} />
              </div>
            )}
            {eligibility && !eligibility.canReview && !isOwnCompany && (
              <p className="mt-2 text-sm text-muted">
                {dict.profile[eligibility.reason]}
              </p>
            )}

            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {dict.profile.noReviews}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {reviews.map((review) => (
                  <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <Stars
                        rating={review.rating}
                        label={ratingLabel(review.rating)}
                      />
                      <span className="text-xs text-muted">
                        {review.author} ·{" "}
                        {review.createdAt.toLocaleDateString(
                          dateLocales[locale],
                        )}
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
        </div>

        {/* ---------- Right column: contacts + quote request ---------- */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <section className="card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {dict.profile.contacts}
            </h2>
            <p className="mt-2 text-sm">
              {company.address}
              <br />
              {company.postalCode} {company.city} ({company.province})
            </p>
            {company.phone && (
              <p className="mt-2 text-sm">
                <a href={`tel:${company.phone}`} className="link">
                  {format(dict.profile.phone, { phone: company.phone })}
                </a>
              </p>
            )}
            {hasMap && (
              <div className="mt-4">
                <CompanyMap
                  latitude={latitude}
                  longitude={longitude}
                  title={format(dict.profile.map, {
                    name: company.businessName,
                  })}
                  openLabel={dict.profile.openMap}
                />
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="mb-3 text-lg font-semibold">
              {dict.profile.requestQuote}
            </h2>
            {!ctx.session ? (
              <p className="text-sm">
                <Link href="/login" className="link">
                  {dict.profile.loginLink}
                </Link>{" "}
                {dict.profile.loginToRequest}
              </p>
            ) : isOwnCompany ? (
              <p className="text-sm text-muted">{dict.profile.yourCompany}</p>
            ) : (
              <QuoteRequestForm companyId={company.id} />
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
