import Form from "next/form";
import Link from "next/link";
import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { getDictionary } from "@/lib/i18n/server";
import { categoryName, format } from "@/lib/i18n/dictionaries";
import { CompanyAvatar } from "@/components/company-avatar";
import { Stars } from "@/components/stars";

// Public home page: search form + results list.
// Server Component — the filters live in the URL (/?city=Roma&category=2),
// so a search can be bookmarked or shared, and the page works even
// without client-side JavaScript.

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // A search param can be missing, a string, or an array (?city=a&city=b):
  // we only accept a single string and ignore everything else.
  // Capped at 60 chars, like the search input schema: a longer value
  // would make the query throw and the page fail.
  const city =
    typeof params.city === "string" ? params.city.trim().slice(0, 60) : "";
  const categoryParam =
    typeof params.category === "string" ? Number(params.category) : NaN;
  const categoryId =
    Number.isInteger(categoryParam) && categoryParam > 0
      ? categoryParam
      : undefined;

  const { dict } = await getDictionary();
  const caller = appRouter.createCaller(await createContext());
  const [categories, companies] = await Promise.all([
    caller.categories.list(),
    caller.companies.search({ city: city || undefined, categoryId }),
  ]);

  const hasFilters = city !== "" || categoryId !== undefined;

  return (
    <main className="container-page">
      <section className="py-6 sm:py-10">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          {dict.home.title}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{dict.home.subtitle}</p>

        {/* action="" = stay on this page, only the search params change */}
        <Form
          action=""
          className="card mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label>
            <span className="label">{dict.home.city}</span>
            <input
              name="city"
              defaultValue={city}
              placeholder={dict.home.cityPlaceholder}
              className="input"
            />
          </label>

          <label>
            <span className="label">{dict.home.trade}</span>
            <select
              name="category"
              defaultValue={categoryId ?? ""}
              className="input"
            >
              <option value="">{dict.home.allTrades}</option>
              {categories
                // Sorted by the translated name, so the list is alphabetical
                // in the visitor's language.
                .toSorted((a, b) =>
                  categoryName(dict, a).localeCompare(categoryName(dict, b)),
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryName(dict, category)}
                  </option>
                ))}
            </select>
          </label>

          <button type="submit" className="btn btn-primary">
            {dict.home.search}
          </button>
        </Form>
      </section>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {companies.length === 0
            ? dict.home.noResults
            : companies.length === 1
              ? dict.home.resultsOne
              : format(dict.home.resultsOther, { count: companies.length })}
        </p>
        {hasFilters && (
          <Link href="/" className="link text-sm">
            {dict.home.clearFilters}
          </Link>
        )}
      </div>

      {companies.length === 0 && hasFilters && (
        <p className="mt-2 text-sm text-muted">{dict.home.noResultsHint}</p>
      )}

      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <li key={company.id}>
            <Link
              href={`/companies/${company.id}`}
              className="card flex h-full gap-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
            >
              <CompanyAvatar name={company.businessName} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">
                  {company.businessName}
                </h2>
                <p className="text-sm text-muted">
                  {company.city} ({company.province})
                </p>
                {company.averageRating !== null && (
                  <p className="mt-1 flex items-center gap-1 text-sm">
                    <Stars
                      rating={company.averageRating}
                      label={format(dict.reviewForm.outOfFive, {
                        rating: company.averageRating.toFixed(1),
                      })}
                    />
                    <span className="text-muted">
                      {company.averageRating.toFixed(1)} ({company.reviewCount})
                    </span>
                  </p>
                )}
                {company.description && (
                  <p className="mt-2 line-clamp-2 text-sm">
                    {company.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {company.categories.map((c) => (
                    <span key={c.categoryId} className="chip">
                      {categoryName(dict, c.category)}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
