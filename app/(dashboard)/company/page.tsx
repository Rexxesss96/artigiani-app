"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { CompanyForm } from "@/components/company-form";
import { CompanyAvatar } from "@/components/company-avatar";
import { Stars } from "@/components/stars";
import { useI18n } from "@/components/i18n-provider";
import { format } from "@/lib/i18n/dictionaries";

// /company: registration form if the user has no company yet,
// otherwise the dashboard overview (numbers at a glance).

export default function CompanyOverviewPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: session, isPending: sessionPending } = useSession();
  const { dict } = useI18n();
  const d = dict.dashboard;

  const { data: myCompany, isPending: companyPending } =
    trpc.companies.getMine.useQuery(undefined, { enabled: !!session });
  const { data: stats } = trpc.companies.stats.useQuery(undefined, {
    enabled: !!myCompany,
  });

  const createCompany = trpc.companies.create.useMutation({
    onSuccess: async () => {
      await utils.companies.getMine.invalidate();
      // The layout is a Server Component: refresh it so the side menu
      // appears now that the company exists.
      router.refresh();
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

  // ---------- Overview ----------
  const statCards = [
    {
      label: d.statPending,
      value: stats?.pending,
      highlight: !!stats?.pending,
    },
    { label: d.statAccepted, value: stats?.accepted },
    { label: d.statReviews, value: stats?.reviewCount },
  ];

  return (
    <main className="flex flex-col gap-6">
      <section className="card flex flex-wrap items-center gap-4">
        <CompanyAvatar name={myCompany.businessName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {myCompany.businessName}
          </h1>
          <p className="text-sm text-muted">{d.subtitle}</p>
        </div>
        <Link href={`/companies/${myCompany.id}`} className="btn btn-secondary">
          {d.viewProfile}
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`card ${card.highlight ? "border-accent" : ""}`}
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-1 text-3xl font-bold">{card.value ?? "–"}</p>
          </div>
        ))}
        <div className="card">
          <p className="text-sm text-muted">{d.statRating}</p>
          {stats?.averageRating ? (
            <p className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-bold">
                {stats.averageRating.toFixed(1)}
              </span>
              <Stars
                rating={stats.averageRating}
                label={format(dict.reviewForm.outOfFive, {
                  rating: stats.averageRating.toFixed(1),
                })}
              />
            </p>
          ) : (
            <p className="mt-1 text-3xl font-bold">–</p>
          )}
        </div>
      </section>

      {!!stats?.pending && (
        <Link href="/company/requests" className="btn btn-primary self-start">
          {d.seeRequests}
        </Link>
      )}
    </main>
  );
}
