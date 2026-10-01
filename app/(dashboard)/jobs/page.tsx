"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import { JobBadges, JobStatusBadge } from "@/components/job-badges";
import { dateLocales } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionaries";

// /jobs — "My jobs": every job the customer posted, newest first.

export default function MyJobsPage() {
  const { dict, locale } = useI18n();
  const j = dict.jobs;
  const { data: session, isPending: sessionPending } = useSession();
  const { data: jobs, isPending } = trpc.jobs.listMine.useQuery(undefined, {
    enabled: !!session,
  });

  if (sessionPending) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }
  if (!session) {
    return (
      <main className="container-page">
        <p className="card">
          {dict.requestsPage.loginRequired}{" "}
          <Link href="/login" className="link">
            {dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container-page max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{j.myJobsTitle}</h1>
          <p className="mt-1 text-muted">{j.myJobsSubtitle}</p>
        </div>
        <Link href="/jobs/new" className="btn btn-primary">
          + {j.postJob}
        </Link>
      </div>

      {isPending && <p className="mt-6 text-muted">{dict.common.loading}</p>}

      {jobs?.length === 0 && (
        <p className="card mt-6">
          {j.empty}{" "}
          <Link href="/jobs/new" className="link">
            {j.postJob}
          </Link>
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {jobs?.map((job) => (
          <li key={job.id}>
            <Link
              href={`/jobs/${job.id}`}
              className="card block transition hover:border-accent/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{job.title}</h2>
                  <p className="text-xs text-muted">
                    {job.city} ·{" "}
                    {new Date(job.createdAt).toLocaleDateString(
                      dateLocales[locale],
                    )}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
              <div className="mt-3">
                <JobBadges job={job} />
              </div>
              <p className="mt-3 text-sm text-muted">
                {job.chosenCompany
                  ? format(j.chosen, { name: job.chosenCompany })
                  : format(j.quotesSummary, {
                      quotes: job.quoteCount,
                      companies: job.companyCount,
                    })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
