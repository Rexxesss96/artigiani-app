import Form from "next/form";
import Link from "next/link";
import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";

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
  const city = typeof params.city === "string" ? params.city.trim() : "";
  const categoryParam =
    typeof params.category === "string" ? Number(params.category) : NaN;
  const categoryId =
    Number.isInteger(categoryParam) && categoryParam > 0
      ? categoryParam
      : undefined;

  const caller = appRouter.createCaller(await createContext());
  const [categories, companies] = await Promise.all([
    caller.categories.list(),
    caller.companies.search({ city: city || undefined, categoryId }),
  ]);

  const hasFilters = city !== "" || categoryId !== undefined;

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-3xl font-bold">
        Find local companies and tradespeople
      </h1>

      {/* action="" = stay on this page, only the search params change */}
      <Form action="" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          City
          <input
            name="city"
            defaultValue={city}
            placeholder="e.g. Roma"
            className="mt-1 rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col text-sm">
          Trade
          <select
            name="category"
            defaultValue={categoryId ?? ""}
            className="mt-1 rounded border border-gray-300 px-3 py-2"
          >
            <option value="">All trades</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="cursor-pointer rounded bg-black px-4 py-2 text-white"
        >
          Search
        </button>

        {hasFilters && (
          <Link href="/" className="py-2 text-sm underline">
            Clear filters
          </Link>
        )}
      </Form>

      <p className="mt-6 text-sm text-gray-600">
        {companies.length === 0
          ? "No companies found."
          : `${companies.length} ${companies.length === 1 ? "company" : "companies"} found.`}
      </p>

      <ul className="mt-4 flex flex-col gap-4">
        {companies.map((company) => (
          <li key={company.id}>
            <Link
              href={`/companies/${company.id}`}
              className="block rounded border border-gray-200 p-4 hover:border-gray-400"
            >
              <h2 className="text-lg font-semibold">{company.businessName}</h2>
              <p className="text-sm text-gray-600">
                {company.city} ({company.province})
              </p>
              {company.description && (
                <p className="mt-2 line-clamp-2 text-sm">
                  {company.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {company.categories.map((c) => (
                  <span
                    key={c.categoryId}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
                  >
                    {c.category.name}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
