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
    return <p>{dict.dashboard.loadingRequests}</p>;
  }

  if (!requests || requests.length === 0) {
    return <p className="text-gray-600">{dict.dashboard.noRequests}</p>;
  }

  return (
    <>
      {updateStatus.error && (
        <p className="mb-3 text-sm text-red-600">
          {updateStatus.error.message}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {requests.map((request) => (
          <li key={request.id} className="rounded border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold">
                {request.user.firstName} {request.user.lastName}
              </p>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(request.createdAt).toLocaleDateString(
                dateLocales[locale],
              )}{" "}
              ·{" "}
              <a href={`mailto:${request.user.email}`} className="underline">
                {request.user.email}
              </a>
            </p>
            <p className="mt-2 whitespace-pre-line text-sm">
              {request.message}
            </p>

            {request.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: request.id, status: "accepted" })
                  }
                  disabled={updateStatus.isPending}
                  className="cursor-pointer rounded bg-green-700 px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  {dict.dashboard.accept}
                </button>
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: request.id, status: "rejected" })
                  }
                  disabled={updateStatus.isPending}
                  className="cursor-pointer rounded border border-red-700 px-3 py-1 text-sm text-red-700 disabled:opacity-50"
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
