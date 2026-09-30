"use client";

import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";

// Company dashboard section: quote requests received by my company,
// with Accept / Reject buttons on the pending ones.

export function ReceivedRequests() {
  const { dict, locale } = useI18n();
  const utils = trpc.useUtils();
  const { data: requests, isPending } =
    trpc.quoteRequests.listReceived.useQuery();

  const updateStatus = trpc.quoteRequests.updateStatus.useMutation({
    // Reload the list so the badge and buttons reflect the new status.
    onSuccess: () => utils.quoteRequests.listReceived.invalidate(),
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

            {request.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: request.id, status: "accepted" })
                  }
                  disabled={updateStatus.isPending}
                  className="btn bg-green-700 text-white hover:bg-green-800"
                >
                  {dict.dashboard.accept}
                </button>
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: request.id, status: "rejected" })
                  }
                  disabled={updateStatus.isPending}
                  className="btn btn-secondary text-red-700 dark:text-red-400"
                >
                  {dict.dashboard.reject}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
