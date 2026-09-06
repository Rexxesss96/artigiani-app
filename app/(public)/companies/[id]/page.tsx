import { createContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/routers/_app";
import { notFound } from "next/navigation";

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

  const caller = appRouter.createCaller(await createContext());
  const company = await caller.companies.getById({ id: companyId });

  if (!company) {
    notFound();
  }

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
    </main>
  );
}
