"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/components/i18n-provider";
import { JobBadges, JobStatusBadge } from "@/components/job-badges";
import { CompanyAvatar } from "@/components/company-avatar";
import { Stars } from "@/components/stars";
import { dateLocales } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/dictionaries";
import { formatMoney } from "@/lib/money";
import { uploadUrl } from "@/lib/uploads";

// /jobs/[id] — one of my jobs: details, photos and the quotes from
// each company side by side, to compare them and choose one.

export default function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // use() reads a Promise inside a Client Component (params is a
  // Promise in this version of Next).
  const { id } = use(params);
  const jobId = Number(id);
  const { dict, locale } = useI18n();
  const j = dict.jobs;
  const utils = trpc.useUtils();
  const { data: session, isPending: sessionPending } = useSession();

  const { data: job, isPending } = trpc.jobs.getMine.useQuery(
    { id: jobId },
    { enabled: !!session && Number.isInteger(jobId) && jobId > 0 },
  );

  // After any action, reload this job and the "My jobs" list.
  const refresh = () =>
    Promise.all([
      utils.jobs.getMine.invalidate({ id: jobId }),
      utils.jobs.listMine.invalidate(),
    ]);
  const chooseQuote = trpc.jobs.chooseQuote.useMutation({
    onSuccess: refresh,
  });
  const complete = trpc.jobs.complete.useMutation({ onSuccess: refresh });
  const cancel = trpc.jobs.cancel.useMutation({ onSuccess: refresh });
  const error = chooseQuote.error ?? complete.error ?? cancel.error;

  if (sessionPending || (session && isPending)) {
    return <p className="container-page text-muted">{dict.common.loading}</p>;
  }
  if (!session || !job) {
    return (
      <main className="container-page">
        <p className="card">
          {session ? j.notFound : dict.requestsPage.loginRequired}{" "}
          <Link href={session ? "/jobs" : "/login"} className="link">
            {session ? j.back : dict.nav.login}
          </Link>
        </p>
      </main>
    );
  }

  // Quotes first (cheapest first), then waiting, then the rest.
  const order = {
    accepted: 0,
    quoted: 1,
    pending: 2,
    not_selected: 3,
    rejected: 4,
    cancelled: 5,
  };
  const requests = job.quoteRequests.toSorted(
    (a, b) =>
      order[a.status] - order[b.status] ||
      (a.quoteAmountCents ?? Infinity) - (b.quoteAmountCents ?? Infinity),
  );
  const chosen = requests.find((r) => r.status === "accepted");

  return (
    <main className="container-page max-w-4xl space-y-6">
      <Link href="/jobs" className="link text-sm">
        {j.back}
      </Link>

      {/* ---------- The job ---------- */}
      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <p className="text-sm text-muted">
              {job.address ? `${job.address}, ` : ""}
              {job.city} ·{" "}
              {new Date(job.createdAt).toLocaleDateString(dateLocales[locale])}
            </p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>
        <div className="mt-3">
          <JobBadges job={job} />
        </div>
        <p className="mt-4 whitespace-pre-line">{job.description}</p>

        {job.photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {job.photos.map((photo) => (
              <li key={photo.id}>
                <a
                  href={uploadUrl(photo.fileName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-square overflow-hidden rounded-xl border border-border"
                >
                  <Image
                    src={uploadUrl(photo.fileName)}
                    alt={j.jobPhotoAlt}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {job.status === "assigned" && (
            <button
              onClick={() => complete.mutate({ id: job.id })}
              disabled={complete.isPending}
              className="btn btn-primary"
            >
              ✓ {j.markCompleted}
            </button>
          )}
          {job.status === "open" && (
            <button
              onClick={() => {
                if (window.confirm(j.confirmCancelJob)) {
                  cancel.mutate({ id: job.id });
                }
              }}
              disabled={cancel.isPending}
              className="btn btn-secondary"
            >
              {j.cancelJob}
            </button>
          )}
          {job.status === "completed" && chosen && (
            <>
              <p className="success-text w-full">{j.completedHint}</p>
              <Link
                href={`/companies/${chosen.company.id}`}
                className="btn btn-primary"
              >
                ★ {format(j.leaveReview, { name: chosen.company.businessName })}
              </Link>
            </>
          )}
        </div>
        {error && <p className="error-text mt-3">{error.message}</p>}
      </section>

      {/* ---------- The quotes ---------- */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {j.quotesTitle}{" "}
          <span className="text-sm font-normal text-muted">
            · {format(j.sentTo, { count: requests.length })}
          </span>
        </h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <li
              key={request.id}
              className={`card flex flex-col ${
                request.status === "accepted" ? "border-2 border-accent" : ""
              } ${
                ["rejected", "not_selected", "cancelled"].includes(
                  request.status,
                )
                  ? "opacity-60"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <CompanyAvatar
                  name={request.company.businessName}
                  logoFile={request.company.logoFile}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/companies/${request.company.id}`}
                    className="font-semibold hover:text-accent"
                  >
                    {request.company.businessName}
                  </Link>
                  <p className="text-xs text-muted">
                    {request.company.city} ({request.company.province})
                  </p>
                  {request.company.averageRating !== null && (
                    <p className="flex items-center gap-1 text-xs">
                      <Stars
                        rating={request.company.averageRating}
                        label={format(dict.reviewForm.outOfFive, {
                          rating: request.company.averageRating.toFixed(1),
                        })}
                      />
                      {request.company.averageRating.toFixed(1)} (
                      {request.company.reviewCount})
                    </p>
                  )}
                </div>
                {request.status === "accepted" && (
                  <span className="chip">{j.chosenBadge}</span>
                )}
                {request.status === "not_selected" && (
                  <span className="text-xs text-muted">{j.notChosen}</span>
                )}
              </div>

              <div className="mt-4 flex-1">
                {request.quoteAmountCents !== null ? (
                  <p className="text-2xl font-bold">
                    {formatMoney(request.quoteAmountCents, locale)}
                  </p>
                ) : (
                  <p className="text-sm text-muted">
                    {request.status === "rejected"
                      ? j.declined
                      : request.status === "pending"
                        ? j.waiting
                        : dict.status[request.status]}
                  </p>
                )}
                {request.responseMessage && (
                  <p className="mt-2 whitespace-pre-line text-sm">
                    {request.responseMessage}
                  </p>
                )}
              </div>

              {job.status === "open" && request.status === "quoted" && (
                <button
                  onClick={() => {
                    if (window.confirm(j.confirmChoose)) {
                      chooseQuote.mutate({ requestId: request.id });
                    }
                  }}
                  disabled={chooseQuote.isPending}
                  className="btn btn-primary mt-4"
                >
                  {j.choose}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
