"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const { data: categories, isPending: categoriesPending } =
    trpc.categories.list.useQuery();

  const { data: myCompany, isPending: companyPending } =
    trpc.companies.getMine.useQuery(undefined, {
      enabled: !!session,
    });

  const createCompany = trpc.companies.create.useMutation({
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  function toggleCategory(id: number) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createCompany.mutate({
      businessName: formData.get("businessName") as string,
      vatNumber: formData.get("vatNumber") as string,
      sdiCode: (formData.get("sdiCode") as string) || undefined,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      province: formData.get("province") as string,
      postalCode: formData.get("postalCode") as string,
      phone: (formData.get("phone") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      categoryIds: selectedCategories,
    });
  }

  if (sessionPending || companyPending) {
    return <p className="p-8">Loading...</p>;
  }

  if (!session) {
    return (
      <main className="p-8">
        <p>You need to be logged in to register a company.</p>
      </main>
    );
  }

  if (myCompany) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">{myCompany.businessName}</h1>
        <p className="text-gray-600">You already have a registered company.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-2xl font-semibold">Register your company</h1>

        <input
          name="businessName"
          placeholder="Business name"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="vatNumber"
          placeholder="VAT number (11 digits)"
          required
          minLength={11}
          maxLength={11}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="sdiCode"
          placeholder="SDI code (optional)"
          maxLength={7}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <input
          name="address"
          placeholder="Address"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <div className="flex gap-3">
          <input
            name="city"
            placeholder="City"
            required
            className="w-1/2 rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="province"
            placeholder="Province (e.g. VA)"
            required
            maxLength={2}
            className="w-1/4 rounded border border-gray-300 px-3 py-2"
          />
          <input
            name="postalCode"
            placeholder="ZIP"
            required
            maxLength={5}
            className="w-1/4 rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <input
          name="phone"
          placeholder="Phone (optional)"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <textarea
          name="description"
          placeholder="Short description (optional)"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <div>
          <p className="mb-2 text-sm font-medium">Trades</p>
          <div className="grid grid-cols-2 gap-2">
            {categoriesPending && <p>Loading categories...</p>}
            {categories?.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        {createCompany.error && (
          <p className="text-sm text-red-600">{createCompany.error.message}</p>
        )}

        <button
          type="submit"
          disabled={createCompany.isPending || selectedCategories.length === 0}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-50 cursor-pointer"
        >
          {createCompany.isPending ? "Creating..." : "Register company"}
        </button>
      </form>
    </main>
  );
}
