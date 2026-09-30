"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { useI18n } from "@/components/i18n-provider";
import { dateLocales } from "@/lib/i18n/config";

// "My requests": the quote requests the logged-in user has sent.

export default function MyRequestsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const { dict, locale } = useI18n();

  const { data: requests, isPending: requestsPending } =
    trpc.quoteRequests.listSent.useQuery(undefined, {
      enabled: !!session,
    });

  if (sessionPending) {
    return <p className="p-8">{dict.common.loading}</p>;
  }

  if (!session) {
    return (
      <main className="p-8">
        <p>{dict.requestsPage.loginRequired}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">{dict.requestsPage.title}</h1>

      {requestsPending && <p className="mt-4">{dict.common.loading}</p>}

      {requests?.length === 0 && (
        <p className="mt-4 text-gray-600">
          {dict.requestsPage.empty}{" "}
          <Link href="/" className="underline">
            {dict.requestsPage.findCompany}
          </Link>
          .
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {requests?.map((request) => (
          <li key={request.id} className="rounded border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/companies/${request.company.id}`}
                className="font-semibold underline"
              >
                {request.company.businessName}
              </Link>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(request.createdAt).toLocaleDateString(dateLocales[locale])} ·{" "}
              {request.company.city}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm">
              {request.message}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
