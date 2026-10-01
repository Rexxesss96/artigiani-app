import Form from "next/form";
import Link from "next/link";
import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { getDictionary } from "@/lib/i18n/server";
import { categoryName, format } from "@/lib/i18n/dictionaries";
import { CompanyAvatar } from "@/components/company-avatar";
import { Stars } from "@/components/stars";
import { HeroIllustration } from "@/components/hero-illustration";
import { TradeIcon } from "@/components/trade-icon";
import { CompaniesMapLoader } from "@/components/companies-map-loader";

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
  // Anything other than the expected values falls back to the default.
  const sort =
    params.sort === "rating" || params.sort === "distance"
      ? params.sort
      : "name";
  const emergency = params.emergency === "1";
  const view = params.view === "map" ? "map" : "list";

  const { dict } = await getDictionary();
  const caller = appRouter.createCaller(await createContext());
  const [categories, companies] = await Promise.all([
    caller.categories.list(),
    caller.companies.search({
      city: city || undefined,
      categoryId,
      emergency,
      sort,
    }),
  ]);

  const hasFilters = city !== "" || categoryId !== undefined || emergency;

  // Sorted by the translated name, so lists are alphabetical in the
  // visitor's language.
  const sortedCategories = categories.toSorted((a, b) =>
    categoryName(dict, a).localeCompare(categoryName(dict, b)),
  );

  // Builds a link to this page with the current search, changing only
  // what's in `changes` (e.g. a trade tile changes just the category).
  function hrefWith(
    changes: Partial<
      Record<"city" | "category" | "sort" | "view" | "emergency", string>
    >,
  ) {
    const values = {
      city,
      category: categoryId ? String(categoryId) : "",
      sort: sort === "name" ? "" : sort,
      view: view === "list" ? "" : view,
      emergency: emergency ? "1" : "",
      ...changes,
    };
    // Empty values are left out, to keep the URL short.
    const query = new URLSearchParams(
      Object.entries(values).filter(([, value]) => value !== ""),
    );
    return query.size > 0 ? `/?${query}` : "/";
  }

  // Leaflet needs numbers; companies without a position can't be shown.
  const mapCompanies = companies.flatMap((c) => {
    const latitude = Number(c.latitude);
    const longitude = Number(c.longitude);
    return c.latitude &&
      c.longitude &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
      ? [
          {
            id: c.id,
            businessName: c.businessName,
            city: c.city,
            latitude,
            longitude,
          },
        ]
      : [];
  });

  return (
    <main className="container-page">
      <section className="py-6 sm:py-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.home.title}
            </h1>
            <p className="mt-3 text-muted">{dict.home.subtitle}</p>
            <Link href="/jobs/new" className="btn btn-primary mt-5">
              + {dict.jobs.postJob}
            </Link>
          </div>
          {/* Decorative drawing, only on wider screens */}
          <HeroIllustration className="hidden w-full text-muted/50 md:block" />
        </div>

        {/* action="" = stay on this page, only the search params change */}
        <Form
          action=""
          className="card mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
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
              {sortedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {categoryName(dict, category)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label">{dict.home.sortBy}</span>
            <select name="sort" defaultValue={sort} className="input">
              <option value="name">{dict.home.sortName}</option>
              <option value="rating">{dict.home.sortRating}</option>
              <option value="distance">{dict.home.sortDistance}</option>
            </select>
          </label>

          {/* Keeps the list/map choice when searching again */}
          {view === "map" && <input type="hidden" name="view" value="map" />}

          <button type="submit" className="btn btn-primary">
            {dict.home.search}
          </button>

          <label className="flex items-center gap-2 text-sm sm:col-span-full">
            <input
              type="checkbox"
              name="emergency"
              value="1"
              defaultChecked={emergency}
              className="accent-accent"
            />
            {dict.home.emergencyOnly}
          </label>
        </Form>

        {/* Trade tiles: one click searches that trade */}
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {sortedCategories.map((category) => {
            const active = category.id === categoryId;
            return (
              <li key={category.id}>
                <Link
                  href={hrefWith({ category: String(category.id) })}
                  aria-current={active ? "true" : undefined}
                  className={`flex h-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-accent bg-accent-soft text-accent-soft-foreground"
                      : "border-border bg-card hover:border-accent/50"
                  }`}
                >
                  <TradeIcon
                    slug={category.slug}
                    className="size-5 shrink-0 text-accent"
                  />
                  <span className="truncate">
                    {categoryName(dict, category)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {companies.length === 0
            ? dict.home.noResults
            : companies.length === 1
              ? dict.home.resultsOne
              : format(dict.home.resultsOther, { count: companies.length })}
        </p>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <Link href="/" className="link text-sm">
              {dict.home.clearFilters}
            </Link>
          )}
          {/* List / Map switch: two links that change only `view` */}
          <div className="flex rounded-lg border border-border p-0.5 text-sm">
            {(["list", "map"] as const).map((v) => (
              <Link
                key={v}
                href={hrefWith({ view: v === "list" ? "" : v })}
                aria-current={view === v ? "true" : undefined}
                className={`rounded-md px-3 py-1 ${
                  view === v ? "bg-foreground text-background" : "text-muted"
                }`}
              >
                {v === "list" ? dict.home.viewList : dict.home.viewMap}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {companies.length === 0 && hasFilters && (
        <p className="mt-2 text-sm text-muted">{dict.home.noResultsHint}</p>
      )}

      {view === "map" && (
        <div className="mt-4">
          <CompaniesMapLoader
            companies={mapCompanies}
            profileLabel={dict.home.seeProfile}
          />
          {mapCompanies.length < companies.length && (
            <p className="mt-2 text-sm text-muted">
              {companies.length - mapCompanies.length === 1
                ? dict.home.notOnMapOne
                : format(dict.home.notOnMap, {
                    count: companies.length - mapCompanies.length,
                  })}
            </p>
          )}
        </div>
      )}

      <ul
        className={`mt-4 grid gap-4 md:grid-cols-2 ${view === "map" ? "hidden" : ""}`}
      >
        {companies.map((company) => (
          <li key={company.id}>
            <Link
              href={`/companies/${company.id}`}
              className="card flex h-full gap-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
            >
              <CompanyAvatar
                name={company.businessName}
                logoFile={company.logoFile}
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">
                  {company.businessName}
                </h2>
                <p className="text-sm text-muted">
                  {company.city} ({company.province})
                  {company.distanceKm !== null &&
                    ` · ${format(dict.home.distanceAway, { km: company.distanceKm })}`}
                </p>
                {company.emergencyService && (
                  <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-400">
                    {dict.home.emergencyBadge}
                  </p>
                )}
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
