"use client";

import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";
import { QuoteResponse } from "@/components/quote-response";
import { RespondForm } from "@/components/respond-form";

// Company dashboard section: quote requests received by my company,
// with Accept / Reject buttons on the pending ones.

export function ReceivedRequests({
  status,
}: {
  // Show only requests with this status (all of them if undefined).
  status?: "pending" | "accepted" | "rejected";
}) {
  const { dict, locale } = useI18n();
  const utils = trpc.useUtils();
  const { data: allRequests, isPending } =
    trpc.quoteRequests.listReceived.useQuery();
  const requests = status
    ? allRequests?.filter((request) => request.status === status)
    : allRequests;

  const updateStatus = trpc.quoteRequests.updateStatus.useMutation({
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
      {updateStatus.error && (
        <p className="error-text mb-3">{updateStatus.error.message}</p>
      )}

      <ul className="flex flex-col gap-4">
        {requests.map((request) => (
          <li key={request.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {request.user.firstName} {request.user.lastName}
                </p>
                <p className="text-xs text-muted">
                  {new Date(request.createdAt).toLocaleDateString(
                    dateLocales[locale],
                  )}{" "}
                  ·{" "}
                  <a href={`mailto:${request.user.email}`} className="link">
                    {request.user.email}
                  </a>
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">
              {request.message}
            </p>

            <QuoteResponse request={request} viewer="company" />

            {request.status === "pending" && (
              <RespondForm
                requestId={request.id}
                isPending={updateStatus.isPending}
                onRespond={(response) => updateStatus.mutate(response)}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
