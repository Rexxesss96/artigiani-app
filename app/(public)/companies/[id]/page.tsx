import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";

// Public Server Component that renders a company's profile page.

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    notFound();
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);
  const company = await caller.companies.getById({ id: companyId });

  if (!company) {
    notFound();
  }

  // Is the visitor looking at their own company? Then no quote form.
  const myCompany = ctx.session ? await caller.companies.getMine() : null;
  const isOwnCompany = myCompany?.id === company.id;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{company.businessName}</h1>
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
    </main>
  );
}
