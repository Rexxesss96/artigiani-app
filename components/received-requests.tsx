"use client";

import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";
import { QuoteResponse } from "@/components/quote-response";
import { RespondForm } from "@/components/respond-form";
import { JobBadges } from "@/components/job-badges";
import { uploadUrl } from "@/lib/uploads";

// Company dashboard: the jobs sent to my company. Each card shows the
// job (what, where, how urgent, budget, photos) and, while pending,
// the form to send a quote or decline.

type Status =
  "pending" | "quoted" | "accepted" | "rejected" | "not_selected" | "cancelled";

export function ReceivedRequests({
  status,
}: {
  // Show only requests with this status (all of them if undefined).
  status?: Status;
}) {
  const { dict, locale } = useI18n();
  const utils = trpc.useUtils();
  const { data: allRequests, isPending } =
    trpc.quoteRequests.listReceived.useQuery();
  const requests = status
    ? allRequests?.filter((request) => request.status === status)
    : allRequests;

  const respond = trpc.quoteRequests.respond.useMutation({
    // Reload everything that depends on the requests: the list, the
    // badge in the menus and the numbers in the overview.
    onSuccess: () =>
      Promise.all([
        utils.quoteRequests.listReceived.invalidate(),
        utils.quoteRequests.pendingCount.invalidate(),
        utils.companies.stats.invalidate(),
      ]),
  });

  if (isPending) {
    return <p className="text-muted">{dict.dashboard.loadingRequests}</p>;
  }

  if (!requests || requests.length === 0) {
    return <p className="card text-muted">{dict.dashboard.noRequests}</p>;
  }

  return (
    <>
      {respond.error && (
        <p className="error-text mb-3">{respond.error.message}</p>
      )}

      <ul className="flex flex-col gap-4">
        {requests.map((request) => (
          <li key={request.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {request.job && (
                  <h3 className="font-semibold">{request.job.title}</h3>
                )}
                <p className="text-xs text-muted">
                  {dict.jobs.customer}: {request.user.firstName}{" "}
                  {request.user.lastName} ·{" "}
                  <a href={`mailto:${request.user.email}`} className="link">
                    {request.user.email}
                  </a>{" "}
                  ·{" "}
                  {new Date(request.createdAt).toLocaleDateString(
                    dateLocales[locale],
                  )}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>

            {request.job ? (
              <>
                <div className="mt-3">
                  <JobBadges job={request.job} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {request.job.address ? `${request.job.address}, ` : ""}
                  {request.job.city}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {request.job.description}
                </p>
                {request.job.photos.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {request.job.photos.map((photo) => (
                      <li key={photo.id}>
                        <a
                          href={uploadUrl(photo.fileName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block size-20 overflow-hidden rounded-lg border border-border"
                        >
                          <Image
                            src={uploadUrl(photo.fileName)}
                            alt={dict.jobs.jobPhotoAlt}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              // Old requests made before jobs existed
              request.message && (
                <p className="mt-3 whitespace-pre-line text-sm">
                  {request.message}
                </p>
              )
            )}

            <QuoteResponse request={request} viewer="company" />

            {request.status === "pending" && (
              <RespondForm
                requestId={request.id}
                isPending={respond.isPending}
                onRespond={(response) => respond.mutate(response)}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
