"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { ReceivedRequests } from "@/components/received-requests";
import { CompanyForm } from "@/components/company-form";
import { CompanyAvatar } from "@/components/company-avatar";
import { useI18n } from "@/components/i18n-provider";

// "My company": registration form if the user has no company yet,
// otherwise the company dashboard (profile + received requests).

export default function CompanyDashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: session, isPending: sessionPending } = useSession();
  const { dict } = useI18n();
  const d = dict.dashboard;

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: myCompany, isPending: companyPending } =
    trpc.companies.getMine.useQuery(undefined, {
      enabled: !!session,
    });

  const createCompany = trpc.companies.create.useMutation({
    onSuccess: async () => {
      await utils.companies.getMine.invalidate();
      router.refresh();
    },
  });

  const updateCompany = trpc.companies.update.useMutation({
    onSuccess: async () => {
      await utils.companies.getMine.invalidate();
      setEditing(false);
      setSaved(true);
    },
  });

  if (sessionPending || (session && companyPending)) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }

  if (!session) {
    return (
      <main className="container-page">
        <p className="card">
          {d.loginRequired}{" "}
          <Link href="/login" className="link">
            {dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  // ---------- No company yet: registration ----------
  if (!myCompany) {
    return (
      <main className="container-page max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">{d.registerTitle}</h1>
        <p className="mt-1 text-muted">{d.registerSubtitle}</p>
        <div className="card mt-6">
          <CompanyForm
            mode="create"
            onSubmit={(values) => createCompany.mutate(values)}
            isPending={createCompany.isPending}
            error={createCompany.error?.message}
          />
        </div>
      </main>
    );
  }

  // ---------- Company dashboard ----------
  // The form works with plain values: turn the DB row (nulls, joined
  // categories) into what CompanyForm expects.
  const initialValues = {
    businessName: myCompany.businessName,
    address: myCompany.address,
    city: myCompany.city,
    province: myCompany.province,
    postalCode: myCompany.postalCode,
    phone: myCompany.phone ?? undefined,
    description: myCompany.description ?? undefined,
    categoryIds: myCompany.categories.map((c) => c.categoryId),
  };

  return (
    <main className="container-page max-w-3xl">
      <section className="card flex flex-wrap items-center gap-4">
        <CompanyAvatar name={myCompany.businessName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {myCompany.businessName}
          </h1>
          <p className="text-sm text-muted">{d.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/companies/${myCompany.id}`}
            className="btn btn-secondary"
          >
            {d.viewProfile}
          </Link>
          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
              className="btn btn-primary"
            >
              {d.editProfile}
            </button>
          )}
        </div>
      </section>

      {saved && <p className="success-text mt-3">{d.saved}</p>}

      {editing && (
        <section className="card mt-6">
          <h2 className="mb-4 text-lg font-semibold">{d.editProfile}</h2>
          <CompanyForm
            mode="edit"
            initial={initialValues}
            // The server ignores fields it doesn't expect (like the
            // empty vatNumber): zod drops unknown keys.
            onSubmit={(values) => updateCompany.mutate(values)}
            isPending={updateCompany.isPending}
            error={updateCompany.error?.message}
            onCancel={() => setEditing(false)}
          />
        </section>
      )}

      <h2 className="mt-8 mb-4 text-lg font-semibold">{d.quoteRequests}</h2>
      <ReceivedRequests />
    </main>
  );
}
