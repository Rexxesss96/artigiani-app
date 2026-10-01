"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CompanyForm } from "@/components/company-form";
import { RequireCompany } from "@/components/require-company";
import { useI18n } from "@/components/i18n-provider";

// /company/profile: edit the public profile of my company.

export default function CompanyProfileEditPage() {
  const { dict } = useI18n();
  const d = dict.dashboard;
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);

  const updateCompany = trpc.companies.update.useMutation({
    onSuccess: async () => {
      await utils.companies.getMine.invalidate();
      setSaved(true);
    },
  });

  return (
    <RequireCompany>
      {(myCompany) => (
        <main>
          <h1 className="text-2xl font-bold tracking-tight">{d.editProfile}</h1>
          <div className="card mt-6">
            <CompanyForm
              // key: re-create the form (and its defaultValues) after a save
              key={myCompany.businessName + myCompany.address}
              mode="edit"
              initial={{
                businessName: myCompany.businessName,
                address: myCompany.address,
                city: myCompany.city,
                province: myCompany.province,
                postalCode: myCompany.postalCode,
                phone: myCompany.phone ?? undefined,
                description: myCompany.description ?? undefined,
                categoryIds: myCompany.categories.map((c) => c.categoryId),
              }}
              // The server ignores fields it doesn't expect (like the
              // empty vatNumber): zod drops unknown keys.
              onSubmit={(values) => {
                setSaved(false);
                updateCompany.mutate(values);
              }}
              isPending={updateCompany.isPending}
              error={updateCompany.error?.message}
            />
            {saved && <p className="success-text mt-3">{d.saved}</p>}
          </div>
        </main>
      )}
    </RequireCompany>
  );
}
